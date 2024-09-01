// Copyright (c) 2024, eldhomathew796@gmail.com and contributors
// For license information, please see license.txt

frappe.ui.form.on('Cost Sheet Calculation', {


   

	onload: function(frm) {
  
	   //    processProductDescriptionTableCoffee(frm)
		  diffOctaFea(frm) 
  
	},


   refresh: function(frm) {

	   process_final_rate_display(frm);


	   frm.add_custom_button(__('Process Market Prices Arabica'), function() {
		   process_market_prices_arabica_coffee(frm);
		
		   find_and_set_max_inr_value_arabica(frm);
		  
		   set_fixed_expense_rows_arabica(frm) 
		   setup_event_listeners(frm);
		  
	   });

	   frm.add_custom_button(__('Process Market Prices Robusta'), function() {
		  
		   process_market_prices_robusta_coffee(frm); 
		   find_and_set_max_inr_value_robusta(frm) 
		   set_fixed_expense_rows_robusta(frm) 
		 
		   setup_event_listeners(frm);
		
	   });

	  

  

	  

	   // Add a listener for adding new rows
	   frm.fields_dict['fob_expenses'].grid.on('grid-row-render', function() {
		   setup_event_listeners(frm);
	   });

   

	   // Calculate total amount on refresh
	   calculate_total_amount(frm);

	   // Process final rate display on refresh
		process_final_rate_display(frm);

	   // Process product description table coffee on refresh
	    //  processProductDescriptionTableCoffee(frm);

	   // Set fixed expense rows on refresh
	   set_fixed_expense_rows(frm);
   },
   organic_table_coffee_add: function(frm) {
	   calculate_total_amount(frm);
   },
   organic_table_coffee_remove: function(frm) {
	   calculate_total_amount(frm);
   },
   production_description_table_coffee_add: function(frm) {
	   calculate_total_amount(frm);
	   processProductDescriptionTableCoffee(frm); // Call the function on add
   },
   production_description_table_coffee_remove: function(frm) {
	   calculate_total_amount(frm);
	   processProductDescriptionTableCoffee(frm); // Call the function on remove
   },
   organic_coffee_total_amount: function(frm) {
	   // Call the function to calculate the difference
	   diffOctaFea(frm);
   },
   total_fob_expense_amount: function(frm) {
	   // Call the function to calculate the difference
	   diffOctaFea(frm);
   },
   product_category: function(frm) {
	   if (frm.doc.product_category === 'Arabica Coffee') {
		   process_market_prices_arabica_coffee(frm);
	   } else if (frm.doc.product_category === 'Robusta Coffee') {
		   process_market_prices_robusta_coffee(frm);
	   }
   }
});

function process_market_prices_arabica_coffee(frm) {
   if (!frm.doc) {
	   frappe.throw(__('Document not found'));
	   return;
   }

   let total_usdkg = 0;
   let total_inr = 0;

   console.log("Processing market prices for Arabica Coffee...");

   if (frm.doc.coffee_market_price_report_ice && frm.doc.coffee_market_price_report_ice_differentials) {
	   frm.doc.coffee_market_price_report_ice.forEach(row => {
		   total_usdkg += row.usdkg || 0;
		   total_inr += row.inrs || 0;
	   });
	   frm.doc.coffee_market_price_report_ice_differentials.forEach(row => {
		   total_usdkg += row.usdkg || 0;
		   total_inr += row.inrs || 0;
	   });
   }

   console.log(`Total USD/Kg: ${total_usdkg}`);
   console.log(`Total INR: ${total_inr}`);

   frm.set_value('total_usdkg', total_usdkg);
   frm.set_value('total_inr', total_inr);

   frm.refresh_field('total_usdkg');
   frm.refresh_field('total_inr');

   frm.save().then(() => {
	   frappe.msgprint(__('Market Prices Processed Successfully'));
   });
}

function process_market_prices_robusta_coffee(frm) {
   if (!frm.doc) {
	   frappe.throw(__('Document not found'));
	   return;
   }

   let total_usdkg = 0;
   let total_inr = 0;

   if (frm.doc.coffee_market_price_report_liffe && frm.doc.coffee_market_price_report_differentials) {
	   frm.doc.coffee_market_price_report_liffe.forEach(row => {
		   total_usdkg += row.usdkg || 0;
		   total_inr += row.inrs || 0;
	   });
	   frm.doc.coffee_market_price_report_differentials.forEach(row => {
		   total_usdkg += row.usdkg || 0;
		   total_inr += row.inrs || 0;
	   });
   }

   frm.set_value('total_usdkg', total_usdkg);
   frm.set_value('total_inr', total_inr);

   frm.refresh_field('total_usdkg');
   frm.refresh_field('total_inr');

   frm.save().then(() => {
	   frappe.msgprint(__('Market Prices Processed Successfully'));
   });
}
function find_and_set_max_inr_value_arabica(frm) {
   if (!frm.doc) {
	   frappe.throw(__('Document not found'));
	   return;
   }

   let max_inr = Number.NEGATIVE_INFINITY;

   function get_max_inr(child_table) {
	   return Math.max(...(frm.doc[child_table] || []).map(row => row.inrs || Number.NEGATIVE_INFINITY));
   }

   // List of child tables to check
   const child_tables = [
	   'ftmp_coffee',
	   'coffee_market_price_per_kg'
   ];

   // Find max inrs value from child tables
   child_tables.forEach(table => {
	   max_inr = Math.max(max_inr, get_max_inr(table));
   });

   // Compare with total_inr value
   if (frm.doc.total_inr !== undefined) {
	   max_inr = Math.max(max_inr, frm.doc.total_inr);
   }

   // Throw an error if no valid INR value found
   if (max_inr === Number.NEGATIVE_INFINITY) {
	   frappe.throw(__('No valid INR values found in the specified child tables and total_inr field'));
	   return;
   }

   // Set the max INR value to the rate field in production_description_table_coffee
   if (frm.doc.production_description_table_coffee) {
	   frm.doc.production_description_table_coffee.forEach(row => {
		   frappe.model.set_value(row.doctype, row.name, 'rate', max_inr);
	   });
   }

   frm.save().then(() => {
	   frappe.msgprint(__('Max INR value set successfully'));
   });
}

function find_and_set_max_inr_value_robusta(frm) {
   if (!frm.doc) {
	   frappe.throw(__('Document not found'));
	   return;
   }

   let max_inr = Number.NEGATIVE_INFINITY;

   function get_max_inr(child_table) {
	   return Math.max(...(frm.doc[child_table] || []).map(row => row.inrs || Number.NEGATIVE_INFINITY));
   }

   // List of child tables to check
   const child_tables = [
	   'ftmp_coffee',
	   'coffee_market_price_per_kg'
   ];

   // Find max inrs value from child tables
   child_tables.forEach(table => {
	   max_inr = Math.max(max_inr, get_max_inr(table));
   });

   // Compare with total_inr value
   if (frm.doc.total_inr !== undefined) {
	   max_inr = Math.max(max_inr, frm.doc.total_inr);
   }

   // Throw an error if no valid INR value found
   if (max_inr === Number.NEGATIVE_INFINITY) {
	   frappe.throw(__('No valid INR values found in the specified child tables and total_inr field'));
	   return;
   }

   // Set the max INR value to the rate field in production_description_table_coffee
   if (frm.doc.production_description_table_coffee) {
	   frm.doc.production_description_table_coffee.forEach(row => {
		   frappe.model.set_value(row.doctype, row.name, 'rate', max_inr);
	   });
   }

   frm.save().then(() => {
	   frappe.msgprint(__('Max INR value set successfully'));
   });
}


function calculate_total_amount(frm) {
   let total_amount = 0;

   if (frm.doc.organic_table_coffee) {
	   frm.doc.organic_table_coffee.forEach(function(row) {
		   total_amount += row.inrs || 0;
	   });
   }

   if (frm.doc.production_description_table_coffee) {
	   frm.doc.production_description_table_coffee.forEach(function(row) {
		   total_amount += row.amount || 0;
	   });
   }

   frm.set_value('organic_coffee_total_amount', total_amount);
}








// function processProductDescriptionTableCoffee(frm) {
//     if (frm.doc.production_description_table_coffee) {
//         frm.doc.production_description_table_coffee.forEach(item => {
//             item.amount = item.qty ? item.qty * item.rate : 0;
//         });
//         frm.refresh_field('production_description_table_coffee');
//     }
// }



function setup_event_listeners(frm) {
   frm.doc.fob_expenses.forEach((row, idx) => {
	   let grid_row = frm.fields_dict['fob_expenses'].grid.grid_rows[idx];
	   
	   // Add listeners for rate and qty changes
	   $(grid_row.fields_dict.rate.input).on('change', () => update_amount(frm, row));
	   $(grid_row.fields_dict.qty.input).on('change', () => update_amount(frm, row));
   });
}

function update_amount(frm, row) {
   let qty = row.qty || 0;
   let rate = row.rate || 0;
   row.amount = qty * rate;

   frm.refresh_field('fob_expenses');
   update_total_fob_expense_amount(frm);
}

function update_total_fob_expense_amount(frm) {
   let total_fob_expense_amount = 0;
   frm.doc.fob_expenses.forEach(row => {
	   total_fob_expense_amount += row.amount;
   });

   frm.set_value('total_fob_expense_amount', total_fob_expense_amount);
   frm.refresh_field('total_fob_expense_amount');
}

function set_fixed_expense_rows_arabica(frm) {
    try {
        let fixed_expenses = [
            { product_description: "Testing Charges", rate: 3.00 },
            { product_description: "Packaging Materials", rate: 2.50 },
            { product_description: "Loading and Unloading Charges", rate: 2.00 },
            { product_description: "Transportation Charges", rate: 2.00 },
            { product_description: "Container Carrying Charges", rate: 1.75 },
            { product_description: "CHA Documentation Charges", rate: 2.50 }
        ];

        // Add "Organic TC Charges" if is_organic is checked
        if (frm.doc.is_organic == 1) {
            fixed_expenses.unshift({ product_description: "Organic TC Charges", rate: 2.00 });
        }

        let spice_qty = 0;
        if (frm.doc.production_description_table_coffee && frm.doc.production_description_table_coffee.length > 0) {
            spice_qty = frm.doc.production_description_table_coffee[0].qty;
        } else {
            frappe.throw("No rows found in production_description_table_coffee");
        }

        let existing_expenses = {};
        frm.doc.fob_expenses.forEach(row => {
            existing_expenses[row.product_description] = row;
        });

        fixed_expenses.forEach(expense => {
            let product_description = expense.product_description;
            let rate = expense.rate;
            let amount = spice_qty * rate;

            if (existing_expenses[product_description]) {
                let row = existing_expenses[product_description];

                // Only update if the value is not manually edited
                if (!row.qty) {
                    frappe.model.set_value(row.doctype, row.name, 'qty', spice_qty);
                }
                if (!row.rate) {
                    frappe.model.set_value(row.doctype, row.name, 'rate', rate);
                }
                if (!row.amount) {
                    frappe.model.set_value(row.doctype, row.name, 'amount', amount);
                }
            } else {
                frm.add_child("fob_expenses", {
                    product_description: product_description,
                    qty: spice_qty,
                    rate: rate,
                    amount: amount
                });
            }
        });

        update_total_fob_expense_amount(frm);
        frm.refresh_field('fob_expenses');

    } catch (e) {
        frappe.msgprint(`Error setting fixed expense rows: ${e}`);
        console.error(`Error setting fixed expense rows: ${e}`);
        frappe.throw("An error occurred while setting fixed expense rows. Please check the error log.");
    }
}

function set_fixed_expense_rows_robusta(frm) {
    try {
        let fixed_expenses = [
            { product_description: "Testing Charges", rate: 3.00 },
            { product_description: "Packaging Materials", rate: 2.50 },
            { product_description: "Loading and Unloading Charges", rate: 2.00 },
            { product_description: "Transportation Charges", rate: 2.00 },
            { product_description: "Container Carrying Charges", rate: 1.75 },
            { product_description: "CHA Documentation Charges", rate: 2.50 }
        ];

        // Add "Organic TC Charges" if is_organic is checked
        if (frm.doc.is_organic == 1) {
            fixed_expenses.unshift({ product_description: "Organic TC Charges", rate: 2.00 });
        }

        let spice_qty = 0;
        if (frm.doc.production_description_table_coffee && frm.doc.production_description_table_coffee.length > 0) {
            spice_qty = frm.doc.production_description_table_coffee[0].qty;
        } else {
            frappe.throw("No rows found in production_description_table_coffee");
        }

        let existing_expenses = {};
        frm.doc.fob_expenses.forEach(row => {
            existing_expenses[row.product_description] = row;
        });

        fixed_expenses.forEach(expense => {
            let product_description = expense.product_description;
            let rate = expense.rate;
            let amount = spice_qty * rate;

            if (existing_expenses[product_description]) {
                let row = existing_expenses[product_description];

                // Only update if the value is not manually edited
                if (!row.qty) {
                    frappe.model.set_value(row.doctype, row.name, 'qty', spice_qty);
                }
                if (!row.rate) {
                    frappe.model.set_value(row.doctype, row.name, 'rate', rate);
                }
                if (!row.amount) {
                    frappe.model.set_value(row.doctype, row.name, 'amount', amount);
                }
            } else {
                frm.add_child("fob_expenses", {
                    product_description: product_description,
                    qty: spice_qty,
                    rate: rate,
                    amount: amount
                });
            }
        });

        update_total_fob_expense_amount(frm);
        frm.refresh_field('fob_expenses');

    } catch (e) {
        frappe.msgprint(`Error setting fixed expense rows: ${e}`);
        console.error(`Error setting fixed expense rows: ${e}`);
        frappe.throw("An error occurred while setting fixed expense rows. Please check the error log.");
    }
}










function process_final_rate_display(frm) {
   // Calculate Price Per Kg
   let total_fob = frm.doc.difference_pdtc_total_fob || 0;
   console.log("Total FOB: ", total_fob);

   let qty = frm.doc.production_description_table_coffee ? 
			 frm.doc.production_description_table_coffee.reduce((total, row) => total + (row.qty || 0), 0) : 0;
   console.log("Total Qty: ", qty);

   let price_per_kg = qty ? total_fob / qty : 0;
   console.log("Price Per Kg: ", price_per_kg);

   // Get FT Premium from ft_premium_co child table
   let ft_premium = frm.doc.ft_premium_co ? 
					frm.doc.ft_premium_co.reduce((total, row) => total + (row.inrs || 0), 0) : 0;
   console.log("FT Premium: ", ft_premium);

   // Calculate Selling Rate
   let selling_rate = price_per_kg + ft_premium;
   console.log("Selling Rate: ", selling_rate);

   // Clear the existing rows in final_rate_display
   frm.clear_table('final_rate_display');

   // Add rows to the final_rate_display child table with the desired labels and values
   frm.add_child('final_rate_display', {
	   product_description: 'Price Per Kg',
	   amount: price_per_kg
   });
   frm.add_child('final_rate_display', {
	   product_description: 'FT Premium',
	   amount: ft_premium
   });
   frm.add_child('final_rate_display', {
	   product_description: 'Selling Rate',
	   amount: selling_rate
   });

   // Refresh the field to show updated values
   frm.refresh_field('final_rate_display');
}
