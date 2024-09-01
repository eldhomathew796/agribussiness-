// Copyright (c) 2024, eldhomathew796@gmail.com and contributors
// For license information, please see license.txt

frappe.ui.form.on('Cost Sheet Calculation Oil', {
	onload: function(frm) {
      
        find_and_set_max_inr_value(frm);
        process_final_rate_display(frm);
    },

    before_save: function(frm) {
        process_oil_mp_litre(frm);
		processProductDescriptionTableOil(frm) 
		
    }
});

function process_oil_mp_litre(frm) {
    try {
        const current_date = frappe.datetime.get_today();
        let inr_value = get_inr_value_from_child_table(frm);

        let new_row = {
            remarks: 'Ref: Malayala Manorama',
            dates: current_date,
            eurlitre: 0,
            inrs: 0
        };

        if (!frm.doc.oil_market_price_per_litre || frm.doc.oil_market_price_per_litre.length === 0) {
            frm.add_child('oil_market_price_per_litre', new_row);
        } else {
            frm.doc.oil_market_price_per_litre.forEach(row => {
                if (row.inrs === undefined || row.inrs === null) {
                    row.inrs = 1;
                }
                row.eurlitre = row.inrs / inr_value;
            });
        }

        frm.refresh_field('oil_market_price_per_litre');
    } catch (e) {
        frappe.msgprint({
            title: __('Oil Market Price Per Litre Processing Error'),
            message: __('An error occurred while processing oil market price per litre. Please check the error log.'),
            indicator: 'red'
        });
        frappe.log_error(e.message, 'Oil Market Price Per Litre Processing Error');
    }
}

function get_inr_value_from_child_table(frm) {
    try {
        let inr_value = 91.05; // Default value
        if (frm.doc.exchange_rate_notification_oil && frm.doc.exchange_rate_notification_oil.length > 0) {
            frm.doc.exchange_rate_notification_oil.forEach(row => {
                if (row.inrs !== null && row.inrs !== undefined) {
                    inr_value = row.inrs;
                }
            });
        }
        return inr_value;
    } catch (e) {
        console.error("INR Value Retrieval Error", e);
        frappe.msgprint({
            title: __('INR Value Retrieval Error'),
            indicator: 'red',
            message: __('An error occurred while retrieving INR value. Please check the error log.')
        });
        throw e;
    }
}

function find_and_set_max_inr_value(frm) {
    if (!frm.doc) {
        frappe.throw(__('Document not found'));
        return;
    }

    let max_inr = Number.NEGATIVE_INFINITY;

    function get_max_inr(child_table) {
        return Math.max(...(frm.doc[child_table] || []).map(row => row.inrs || Number.NEGATIVE_INFINITY));
    }

    const child_tables = [
        'ftmp_oil',
        'oil_market_price_per_litre',
        // 'spices_market_price_report'
    ];

    child_tables.forEach(table => {
        max_inr = Math.max(max_inr, get_max_inr(table));
    });

    if (max_inr === Number.NEGATIVE_INFINITY) {
        frappe.throw(__('No INR values found in the specified child tables'));
        return;
    }

    if (frm.doc.product_description_table_oil) {
        frm.doc.product_description_table_oil.forEach(row => {
            frappe.model.set_value(row.doctype, row.name, 'rate', max_inr);
        });
    }

    frm.save().then(() => {
        frappe.msgprint(__('Max INR value set successfully'));
    });
}

function processProductDescriptionTableOil(frm) {
    if (frm.doc.product_description_table_oil) {
        frm.doc.product_description_table_oil.forEach(item => {
            if (item.qty && item.rate) {
                item.amount = item.qty * item.rate;
            } else {
                item.amount = 0;
            }
        });
    }
}


function process_final_rate_display(frm) {
    let price_per_Oil = 0;
    if (frm.doc.product_description_table_oil && frm.doc.product_description_table_oil.length > 0) {
        price_per_Oil = frm.doc.product_description_table_oil.reduce((total, row) => total + (row.rate || 0), 0);
    }

    let ft_premium = frm.doc.ft_premium_oil.reduce((total, row) => total + row.inrs, 0);

    let selling_rate = price_per_Oil + ft_premium;

    frm.clear_table('final_rate_display_oil');

    frm.add_child('final_rate_display_oil', {
        product_description: 'Price Per Oil',
        amount: price_per_Oil
    });
    frm.add_child('final_rate_display_oil', {
        product_description: 'FT Premium',
        amount: ft_premium
    });
    frm.add_child('final_rate_display_oil', {
        product_description: 'Selling Rate',
        amount: selling_rate
    });

    frm.refresh_field('final_rate_display_oil');
}
