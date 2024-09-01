// Copyright (c) 2024, eldhomathew796@gmail.com and contributors
// For license information, please see license.txt

frappe.ui.form.on('Cost Sheet Calculation Spices', {
    onload: function(frm) {
        ftmp_spice_calc(frm);
        // process_spices_mp_kg(frm);
        // // set_fixed_expense_rows_spices(frm); // Uncomment if you want to use this function
        // process_spices_mp_report(frm);
        processProductDescriptionTableSpices(frm);
        find_and_set_max_inr_value(frm);
        process_final_rate_display(frm);
    },
    before_save: function(frm) {
        process_spices_mp_kg(frm);
        process_spices_mp_report(frm);
    }
});

function ftmp_spice_calc(frm) {
    try {
        let inr_value = get_inr_value_from_child_table(frm);

        if (!frm.doc.ftmp_spices || frm.doc.ftmp_spices.length === 0) {
            let new_row = {
                'eurs': 1,
                'inrs': 1 * inr_value
            };
            frm.add_child('ftmp_spices', new_row);
        } else {
            frm.doc.ftmp_spices.forEach(row => {
                if (!row.eurs) {
                    // row.eurs = 1;
                }
                row.inrs = row.eurs * inr_value;
            });
        }

        frm.refresh_field('ftmp_spices');
    } catch (e) {
        console.error("FTMP Spices Calculation Error", e);
        frappe.msgprint({
            title: __('FTMP Spices Calculation Error'),
            indicator: 'red',
            message: __('An error occurred while processing FTMP Spices. Please check the error log.')
        });
    }
}

function get_inr_value_from_child_table(frm) {
    try {
        let inr_value = 91.05; // Default value
        if (frm.doc.exchange_rate_notification_spices && frm.doc.exchange_rate_notification_spices.length > 0) {
            frm.doc.exchange_rate_notification_spices.forEach(row => {
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

function process_spices_mp_kg(frm) {
    try {
        const current_date = frappe.datetime.get_today();
        let inr_value = get_inr_value_from_child_table(frm);

        let new_row = {
            remarks: 'Ref: Malayala Manorama',
            dates: current_date,
            eurkg: 0,
            inrs: 0
        };

        if (!frm.doc.spices_market_price_per_kg || frm.doc.spices_market_price_per_kg.length === 0) {
            frm.add_child('spices_market_price_per_kg', new_row);
        } else {
            frm.doc.spices_market_price_per_kg.forEach(row => {
                if (row.inrs === undefined || row.inrs === null) {
                    row.inrs = 1;
                }
                row.eurkg = row.inrs / inr_value;
            });
        }

        frm.refresh_field('spices_market_price_per_kg');
    } catch (e) {
        frappe.msgprint({
            title: __('Spices Market Price Per KG Processing Error'),
            message: __('An error occurred while processing spices market price per kg. Please check the error log.'),
            indicator: 'red'
        });
        frappe.log_error(e.message, 'Spices Market Price Per KG Processing Error');
    }
}


function process_spices_mp_report(frm) {
    try {
        const current_date = frappe.datetime.get_today();
        let inr_value = get_inr_value_from_child_table(frm);

        let new_row = {
            remarks: 'Ref: Malayala Manorama',
            dates: current_date,
            eurkg: 0,
            inrs: 0
        };

        console.log("New row data:", new_row); // Log new row data

        if (!frm.doc.spices_market_price_report || frm.doc.spices_market_price_report.length === 0) {
            frm.add_child('spices_market_price_report', new_row);
        } else {
            frm.doc.spices_market_price_report.forEach(row => {
                if (!row.inrs) {
                    row.inrs = 1;
                }
                row.eurkg = row.inrs / inr_value;
            });
        }

        frm.refresh_field('spices_market_price_report');
        console.log("Updated Spices Market Price Report:", frm.doc.spices_market_price_report); // Log the updated table

        // Log each row's remarks and dates to verify if they are set correctly
        frm.doc.spices_market_price_report.forEach(row => {
            console.log(`Row remarks: ${row.remarks}, dates: ${row.dates}`);
        });

    } catch (e) {
        frappe.msgprint({
            title: __('Spices Market Price Report Processing Error'),
            message: __('An error occurred while processing spices market price report. Please check the error log.'),
            indicator: 'red'
        });
        frappe.log_error(e.message, 'Spices Market Price Report Processing Error');
    }
}



function processProductDescriptionTableSpices(frm) {
    if (frm.doc.product_description_table_spices) {
        frm.doc.product_description_table_spices.forEach(item => {
            if (item.qty && item.rate) {
                item.amount = item.qty * item.rate;
            } else {
                item.amount = 0;
            }
        });
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
        'ftmp_spices',
        'spices_market_price_per_kg',
        'spices_market_price_report'
    ];

    child_tables.forEach(table => {
        max_inr = Math.max(max_inr, get_max_inr(table));
    });

    if (max_inr === Number.NEGATIVE_INFINITY) {
        frappe.throw(__('No INR values found in the specified child tables'));
        return;
    }

    if (frm.doc.product_description_table_spices) {
        frm.doc.product_description_table_spices.forEach(row => {
            frappe.model.set_value(row.doctype, row.name, 'rate', max_inr);
        });
    }

    frm.save().then(() => {
        frappe.msgprint(__('Max INR value set successfully'));
    });
}

function process_final_rate_display(frm) {
    let price_per_kg = 0;
    if (frm.doc.product_description_table_spices && frm.doc.product_description_table_spices.length > 0) {
        price_per_kg = frm.doc.product_description_table_spices.reduce((total, row) => total + (row.rate || 0), 0);
    }

    let ft_premium = frm.doc.ft_premium_spices.reduce((total, row) => total + row.inrs, 0);

    let selling_rate = price_per_kg + ft_premium;

    frm.clear_table('final_rate_display_spices');

    frm.add_child('final_rate_display_spices', {
        product_description: 'Price Per Kg',
        amount: price_per_kg
    });
    frm.add_child('final_rate_display_spices', {
        product_description: 'FT Premium',
        amount: ft_premium
    });
    frm.add_child('final_rate_display_spices', {
        product_description: 'Selling Rate',
        amount: selling_rate
    });

    frm.refresh_field('final_rate_display_spices');
}