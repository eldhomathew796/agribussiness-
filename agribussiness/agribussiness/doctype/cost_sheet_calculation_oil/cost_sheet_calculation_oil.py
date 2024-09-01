# Copyright (c) 2024, eldhomathew796@gmail.com and contributors
# For license information, please see license.txt

import traceback
import frappe
from frappe.model.document import Document
from frappe.utils import today
from frappe.utils import flt
from datetime import datetime

class CostSheetCalculationOil(Document):
    def before_save(self, method=None):
        try:
            # Initialize flag if not already set
            if not getattr(self, '_exchange_rate_notification_processed', False):
                self.process_exchange_rate_notification()
                self._exchange_rate_notification_processed = True

            # Process child tables
            self.process_ft_premium_oil()
            self.process_ftmp_oil()
        

        except Exception as e:
            frappe.log_error(message=str(e), title="CostSheetCalculation Error")
            frappe.throw("An error occurred during save. Please check the error log.")

    def process_exchange_rate_notification(self):
        try:
            current_date = datetime.today().strftime('%Y-%m-%d')
            inr_value = self.get_inr_value_from_child_table()
            new_row = {
                'exchange_rate_notification_no': '27/2024',
                'customs_nt_date': current_date,
                'eur': 1,
                'inrs': inr_value
            }
            if not self.exchange_rate_notification_oil:
                self.append('exchange_rate_notification_oil', new_row)
            else:
                for row in self.exchange_rate_notification_oil:
                    row.exchange_rate_notification_no = '27/2024'
                    row.customs_nt_date = current_date
                    row.eur = 1
                    row.inrs = inr_value
        except Exception as e:
            frappe.log_error(message=str(e), title="Exchange Rate Notification Processing Error")
            frappe.throw("An error occurred while processing exchange rate notifications. Please check the error log.")

    def get_inr_value_from_child_table(self):
        try:
            inr_value = 91.05  # Default value
            if self.exchange_rate_notification_oil:
                for row in self.exchange_rate_notification_oil:
                    if row.inrs is not None:
                        inr_value = row.inrs
                        break
            frappe.logger().info(f"Retrieved INR value: {inr_value}")
            return inr_value
        except Exception as e:
            frappe.log_error(message=str(e), title="INR Value Retrieval Error")
            frappe.throw("An error occurred while retrieving INR value. Please check the error log.")

    def get_exchange_rate_inr(self):
        try:
            inr_value = self.get_inr_value_from_child_table()
            return 1, inr_value
        except Exception as e:
            frappe.log_error(message=str(e), title="Exchange Rate Retrieval Error")
            frappe.throw("An error occurred while retrieving exchange rates. Please check the error log.")


    def process_ft_premium_oil(self):
        try:
            frappe.logger().info("Starting FT Premium Oil processing")
            _, inr_value = self.get_exchange_rate_inr()
            frappe.logger().info(f"Retrieved exchange rate: {inr_value}")
            inr_value = float(inr_value)
            frappe.logger().info(f"Converted exchange rate to float: {inr_value}")

            if not self.ft_premium_oil:
                frappe.logger().info("No existing rows in ft_premium_oil, appending new row")
                new_row = {
                    'eur': 0.4,
                    'inrs': 0.4 * inr_value
                }
                self.append('ft_premium_oil', new_row)
                frappe.logger().info(f"Appended new row: {new_row}")
            else:
                frappe.logger().info("Updating existing rows in ft_premium_oil")
                for row in self.ft_premium_oil:
                    frappe.logger().info(f"Processing row: {row}")
                    row.inrs = row.eur * inr_value
                    frappe.logger().info(f"Updated row.inrs to: {row.inrs}")
            
            frappe.logger().info("Completed FT Premium Oil processing")

        except Exception as e:
            frappe.log_error(message=str(e), title="FT Premium Oil Processing Error")
            frappe.throw("An error occurred while processing FT Premium Oil. Please check the error log.")

    def process_ftmp_oil(self):
        try:
            frappe.logger().info("Starting FTMP Oil processing")
            
            # Retrieve the exchange rate in INR
            _, inr_value = self.get_exchange_rate_inr()
            frappe.logger().info(f"Retrieved exchange rate: {inr_value}")
            inr_value = float(inr_value)
            frappe.logger().info(f"Converted exchange rate to float: {inr_value}")

            # Check if the ftmp_oil table is empty
            if not self.ftmp_oil:
                frappe.logger().info("No existing rows in ftmp_oil, appending new row with default eur value")
                new_row = {
                    'eur': 1.0,  # Default value for eur
                    'inrs': 1.0 * inr_value  # Calculated inrs value
                }
                self.append('ftmp_oil', new_row)
                frappe.logger().info(f"Appended new row: {new_row}")
            else:
                frappe.logger().info("Updating existing rows in ftmp_oil")
                for row in self.ftmp_oil:
                    frappe.logger().info(f"Processing row: {row}")
                    if row.eur is None:
                        row.eur = 1.0  # Set default value if eur is None
                    row.inrs = row.eur * inr_value  # Calculate INR value based on EUR
                    frappe.logger().info(f"Updated row.inrs to: {row.inrs}")

            frappe.logger().info("Completed FTMP Oil processing")

        except Exception as e:
            frappe.log_error(message=str(e), title="FTMP Oil Processing Error")
            frappe.throw("An error occurred while processing FT Premium Oil. Please check the error log.")
