# Copyright (c) 2024, eldhomathew796@gmail.com and contributors
# For license information, please see license.txt

import traceback
import frappe
from frappe.model.document import Document
from frappe.utils import today
from frappe.utils import flt
from datetime import datetime


class CostSheetCalculation(Document):
    def before_save(self, method=None):
        try:
            # Initialize flag if not already set
            if not getattr(self, '_exchange_rate_notification_processed', False):
                self.process_exchange_rate_notification()
                self._exchange_rate_notification_processed = True

            # Process child tables
            self.process_organic_table_coffee()
            self.process_ft_premium_coffee()
            self.process_ftmp_premium_coffee()
            self.process_coffee_mp_kg()
            # self.set_fixed_expense_rows()
            self.process_coffee_market_price_report()
            self.process_coffee_market_price_report_ice()
            self.process_coffee_market_price_report_ice_differentials()
            self.process_coffee_market_price_report_liffe()
            self.process_coffee_market_price_report_differentials()

            self.diff_octa_fea()
            # self.process_final_rate_display() 
            self.process_product_description_table_coffee()

         
        except Exception as e:
            frappe.log_error(message=str(e), title="CostSheetCalculation Error")
            frappe.throw(("An error occurred during save. Please check the error log."))

    def process_exchange_rate_notification(self):
        try:
            current_date = datetime.today().strftime('%Y-%m-%d')
            inr_value = self.get_inr_value_from_child_table()
            new_row = {
            'exchange_rate_notification_no': '27/2024',
            'customs_nt_date': current_date,
            'usd': 1,
            'inrs': inr_value
            }
            if not self.exchange_rate_notification:
                self.append('exchange_rate_notification', new_row)
            else:
                for row in self.exchange_rate_notification:
                    row.update(new_row)
        except Exception as e:
            frappe.log_error(message=str(e), title="Exchange Rate Notification Processing Error")
            frappe.throw(("An error occurred while processing exchange rate notifications. Please check the error log."))

    def get_inr_value_from_child_table(self):
        try:
            inr_value = 82.60
            for row in self.exchange_rate_notification:
                if row.inrs is not None:
                    inr_value = row.inrs
                    break
            return inr_value
        except Exception as e:
            frappe.log_error(message=str(e), title="INR Value Retrieval Error")
            frappe.throw(("An error occurred while retrieving INR value. Please check the error log."))


    def get_exchange_rate_inr(self):
        try:
            inr_value = self.get_inr_value_from_child_table()
            return 1, inr_value
        except Exception as e:
            frappe.log_error(message=str(e), title="Exchange Rate Retrieval Error")
            frappe.throw(("An error occurred while retrieving exchange rates. Please check the error log."))


    def process_organic_table_coffee(self):
        try:
            _, inr_value = self.get_exchange_rate_inr()
            inr_value = float(inr_value)
            
            if not self.organic_table_coffee:
                new_row = {
                    'in_pound': 0.3,
                    'usdkg': 0.3 * 2.2046,
                    'inrs': 0.3 * 2.2046 * inr_value
                }
                self.append('organic_table_coffee', new_row)
            else:
                for row in self.organic_table_coffee:
                    row.usdkg = float(row.in_pound) * 2.2046
                    row.inrs = row.usdkg * inr_value
        except Exception as e:
            frappe.log_error(message=str(e), title="Organic Table Coffee Processing Error")
            frappe.throw(_("An error occurred while processing organic table coffee. Please check the error log."))


    def process_ft_premium_coffee(self):
        try:
            _, inr_value = self.get_exchange_rate_inr()
            inr_value = float(inr_value)
            
            if not self.ft_premium_co:
                new_row = {
                    'in_pound': 0.2,
                    'usdkg': 0.2 * 2.2046,
                    'inrs': 0.2 * 2.2046 * inr_value
                }
                self.append('ft_premium_co', new_row)
            else:
                for row in self.ft_premium_co:
                    row.usdkg = float(row.in_pound) * 2.2046
                    row.inrs = row.usdkg * inr_value
        except Exception as e:
            frappe.log_error(message=str(e), title="FT Premium Coffee Processing Error")
            frappe.throw(_("An error occurred while processing FT premium coffee. Please check the error log."))


    def process_ftmp_premium_coffee(self):
        try:
            _, inr_value = self.get_exchange_rate_inr()
            inr_value = float(inr_value)
            
            if not self.ftmp_coffee:
                new_row = {
                    'in_pound': 1.2,
                    'usdkg': 1.2 * 2.2046,
                    'inrs': 1.2 * 2.2046 * inr_value
                }
                self.append('ftmp_coffee', new_row)
            else:
                for row in self.ftmp_coffee:
                    row.usdkg = float(row.in_pound) * 2.2046
                    row.inrs = row.usdkg * inr_value
        except Exception as e:
            frappe.log_error(message=str(e), title="Ftmp Table Coffee Processing Error")
            frappe.throw(_("An error occurred while processing Ftmp table coffee. Please check the error log."))



    def process_coffee_mp_kg(self):
        try:
            current_date = datetime.today().strftime('%Y-%m-%d')
            inr_value = self.get_inr_value_from_child_table()
            inr_value = float(inr_value)

            # Debugging log for the exchange rate
            frappe.logger().info(f"INR value fetched: {inr_value}")

            new_row = {
                'remarks': 'Ref: Malayala Manorama',
                'dates': current_date,
                'usdkg': 0,
                'inrs': 0,
                # 'total_value': 0
            }

            if not self.coffee_market_price_per_kg:
                self.append('coffee_market_price_per_kg', new_row)
                frappe.logger().info(f"New row appended: {new_row}")
                # Ensure the new row has the correct values
                assert new_row['remarks'] == 'Ref: Malayala Manorama', f"Expected 'remarks' to be 'Ref: Malayala Manorama', but got {new_row['remarks']}"
                assert new_row['dates'] == current_date, f"Expected 'date' to be {current_date}, but got {new_row['dates']}"
            else:
                for row in self.coffee_market_price_per_kg:
                    row.inrs = row.inrs if row.inrs is not None else 1
                    row.usdkg = row.inrs / inr_value
                    # row.total_value = row.usdkg * row.inrs

                    # Debugging log for each row
                    frappe.logger().info(f"Processed row: {row.as_dict()}")

        except Exception as e:
            frappe.log_error(message=str(e), title="Coffee Market Price Per KG Processing Error")
            frappe.throw("An error occurred while processing coffee market price per kg. Please check the error log.")




    def process_coffee_market_price_report(self):
        try:
            product_category = self.product_category  

            if not product_category:
                # If product_category is not selected, log a warning and skip processing
                frappe.logger().warning("Product category not selected. Skipping coffee market price report processing.")
                return

            if product_category == 'Arabica Coffee':
                self.process_coffee_market_price_report_ice()
                self.process_coffee_market_price_report_ice_differentials()
            elif product_category == 'Robusta Coffee':
                self.process_coffee_market_price_report_liffe()
                self.process_coffee_market_price_report_differentials()
            else:
                frappe.throw("Invalid product category selected")

        except Exception as e:
            frappe.log_error(message=str(e), title="Coffee Market Price Report Processing Error")
            frappe.throw("An error occurred while processing the coffee market price report. Please check the error log.")

    def process_coffee_market_price_report_ice(self):
        try:
            current_date = datetime.today().strftime('%Y-%m-%d')
            inr_value = self.get_inr_value_from_child_table()
            inr_value = float(inr_value)

            # Debugging log for the exchange rate
            frappe.logger().info(f"INR value fetched: {inr_value}")

            new_row = {
                'remarks': 'ICE (New York)',
                'dates': current_date,
                'usdtonnes': 0,
                'usdkg': 0,
                'inrs': 0,
                # 'total_value': 0
            }

            if not self.coffee_market_price_report_ice:
                self.append('coffee_market_price_report_ice', new_row)
                frappe.logger().info(f"New row appended: {new_row}")
                # Ensure the new row has the correct values
                assert new_row['remarks'] == 'ICE (New York)', f"Expected 'remarks' to be 'ICE (New York)', but got {new_row['remarks']}"
                assert new_row['dates'] == current_date, f"Expected 'date' to be {current_date}, but got {new_row['dates']}"
            else:
                for row in self.coffee_market_price_report_ice:
                    # Check if `us_centlb` is valid
                    if row.us_centlb is None or row.us_centlb == 0:
                        frappe.logger().error(f"Invalid us_centlb value: {row.us_centlb}")
                    else:
                        row.usdkg = row.us_centlb * 0.02204

                    # Check if `usdkg` is valid
                    if row.usdkg is None or row.usdkg == 0:
                        frappe.logger().error(f"Invalid usdkg value: {row.usdkg}")
                    else:
                        row.inrs = row.usdkg * inr_value

                    # Debugging log for each row
                    frappe.logger().info(f"Processed row: {row.as_dict()}")

        except Exception as e:
            frappe.log_error(message=str(e), title="Coffee Market Price Report ICE Processing Error")
            frappe.throw("An error occurred while processing coffee market price report ICE. Please check the error log.")

    def process_coffee_market_price_report_ice_differentials(self):
        try:
            current_date = datetime.today().strftime('%Y-%m-%d')
            inr_value = self.get_inr_value_from_child_table()
            inr_value = float(inr_value)

            # Debugging log for the exchange rate
            frappe.logger().info(f"INR value fetched: {inr_value}")

            new_row = {
                'remarks': 'Differentials',
                'dates': current_date,
                'usdtonnes': 0,
                'usdkg': 0,
                'inrs': 0,
                # 'total_value': 0
            }

            if not self.coffee_market_price_report_ice_differentials:
                self.append('coffee_market_price_report_ice_differentials', new_row)
                frappe.logger().info(f"New row appended: {new_row}")
                # Ensure the new row has the correct values
                assert new_row['remarks'] == 'Differentials', f"Expected 'remarks' to be 'Differentials', but got {new_row['remarks']}"
                assert new_row['dates'] == current_date, f"Expected 'date' to be {current_date}, but got {new_row['dates']}"
            else:
                for row in self.coffee_market_price_report_ice_differentials:
                    # Check if `us_centlb` is valid
                    if row.us_centlb is None or row.us_centlb == 0:
                        frappe.logger().error(f"Invalid us_centlb value: {row.us_centlb}")
                    else:
                        row.usdkg = row.us_centlb * 0.02204

                    # Check if `usdkg` is valid
                    if row.usdkg is None or row.usdkg == 0:
                        frappe.logger().error(f"Invalid usdkg value: {row.usdkg}")
                    else:
                        row.inrs = row.usdkg * inr_value

                    # Debugging log for each row
                    frappe.logger().info(f"Processed row: {row.as_dict()}")

        except Exception as e:
            frappe.log_error(message=str(e), title="Coffee Market Price Report ICE Differentials Processing Error")
            frappe.throw("An error occurred while processing coffee market price report ICE Differentials. Please check the error log.")

    def process_coffee_market_price_report_liffe(self):
        try:
            current_date = datetime.today().strftime('%Y-%m-%d')
            inr_value = self.get_inr_value_from_child_table()
            inr_value = float(inr_value)

            # Debugging log for the exchange rate
            frappe.logger().info(f"INR value fetched: {inr_value}")

            new_row = {
                'remarks': 'LIFFE',
                'dates': current_date,
                'usdtonnes': 0,
                'usdkg': 0,
                'inrs': 0,
                # 'total_value': 0
            }

            if not self.coffee_market_price_report_liffe:
                self.append('coffee_market_price_report_liffe', new_row)
                frappe.logger().info(f"New row appended: {new_row}")
                # Ensure the new row has the correct values
                assert new_row['remarks'] == 'LIFFE', f"Expected 'remarks' to be 'LIFFE', but got {new_row['remarks']}"
                assert new_row['dates'] == current_date, f"Expected 'dates' to be {current_date}, but got {new_row['dates']}"
            else:
                for row in self.coffee_market_price_report_liffe:
                    # row.usdkg = row.inrs / inr_value if row.inrs is not None else 1
                    # row.usdtonnes = row.usdkg * 1000
                    row.usdkg = row.usdtonnes / 1000 if row.usdtonnes is not None else 1
                    row.inrs = row.usdkg * inr_value
                    row.total_value = row.usdkg * row.inrs  

                    # Debugging log for each row
                    frappe.logger().info(f"Processed row: {row.as_dict()}")

        except Exception as e:
            frappe.log_error(message=str(e), title="Coffee Market Price Report LIFFE Processing Error")
            frappe.throw("An error occurred while processing coffee market price report LIFFE. Please check the error log.")

    def process_coffee_market_price_report_differentials(self):
        try:
            current_date = datetime.today().strftime('%Y-%m-%d')
            inr_value = self.get_inr_value_from_child_table()
            inr_value = float(inr_value)

            # Debugging log for the exchange rate
            frappe.logger().info(f"INR value fetched: {inr_value}")

            new_row = {
                'remarks': 'Differentials',
                'dates': current_date,
                'usdtonnes': 0,
                'usdkg': 0,
                'inrs': 0,
                # 'total_value': 0
            }

            if not self.coffee_market_price_report_differentials:
                self.append('coffee_market_price_report_differentials', new_row)
                frappe.logger().info(f"New row appended: {new_row}")
                # Ensure the new row has the correct values
                assert new_row['remarks'] == 'Differentials', f"Expected 'remarks' to be 'Differentials', but got {new_row['remarks']}"
                assert new_row['dates'] == current_date, f"Expected 'dates' to be {current_date}, but got {new_row['dates']}"
            else:
                for row in self.coffee_market_price_report_differentials:
                    # row.usdkg = row.inrs / inr_value if row.inrs is not None else 1
                    # row.usdtonnes = row.usdkg * 1000

                    row.usdkg = row.usdtonnes / 1000 if row.usdtonnes is not None else 1
                    row.inrs = row.usdkg * inr_value
                    row.total_value = row.usdkg * row.inrs  

                   
                    frappe.logger().info(f"Processed row: {row.as_dict()}")

        except Exception as e:
            frappe.log_error(message=str(e), title="Coffee Market Price Report Differentials Processing Error")
            frappe.throw("An error occurred while processing coffee market price report Differentials. Please check the error log.")

    def organic_coffee_total_amount_calc(self):
        # Initialize total amount
        total_amount = 0

        # Sum the 'inrs' field values from the 'organic_table_coffee' child table
        if self.organic_table_coffee:
            for item in self.organic_table_coffee:
                total_amount += item.inrs

        # Sum the 'amount' field values from the 'production_description_table_coffee' child table
        if self.production_description_table_coffee:
            for item in self.production_description_table_coffee:
                total_amount += item.amount

        # Store the total amount in the 'organic_coffee_total_amount' field
        self.organic_coffee_total_amount = total_amount

      
        self.save()



    def diff_octa_fea(self):
        # Fetch the value of 'amount' from the 'production_description_table_coffee' child table
        amount = sum([item.amount for item in self.production_description_table_coffee]) if self.production_description_table_coffee else 0

        # Fetch the value of 'total_fob_expense_amount'
        total_fob_expense_amount = self.total_fob_expense_amount or 0

        # Calculate the difference
        difference_pdtc_total_fob = amount - total_fob_expense_amount

        # Set the value of 'difference_pdtc_total_fob'
        self.difference_pdtc_total_fob = difference_pdtc_total_fob

       
        frappe.msgprint(f"Difference PDTCTotal FOB: {difference_pdtc_total_fob}")

    def process_product_description_table_coffee(self):
        if self.production_description_table_coffee:
            for item in self.production_description_table_coffee:
                item.amount = item.qty * item.rate if item.qty else 1



def before_save(self):
    self.organic_coffee_total_amount_calc()

def before_save(self):
    self.set_fixed_expense_rows() 



def before_save(self):
    self.process_product_description_table_coffee()
