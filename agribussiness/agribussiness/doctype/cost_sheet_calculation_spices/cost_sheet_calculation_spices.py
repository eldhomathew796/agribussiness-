# Copyright (c) 2024, eldhomathew796@gmail.com and contributors
# For license information, please see license.txt

import traceback
import frappe
from frappe.model.document import Document
from frappe.utils import today
from frappe.utils import flt
from datetime import datetime

class CostSheetCalculationSpices(Document):
    def before_save(self, method=None):
        try:
            # Initialize flag if not already set
            if not getattr(self, '_exchange_rate_notification_processed', False):
                self.process_exchange_rate_notification()
                self._exchange_rate_notification_processed = True

            # Process child tables
            self.process_ft_premium_spices()
            # self.set_fixed_expense_rows()
            # self.process_spices_mp_kg()

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
            if not self.exchange_rate_notification_spices:
                self.append('exchange_rate_notification_spices', new_row)
            else:
                for row in self.exchange_rate_notification_spices:
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
            if self.exchange_rate_notification_spices:
                for row in self.exchange_rate_notification_spices:
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

    def process_ft_premium_spices(self):
        try:
            frappe.logger().info("Starting FT Premium Spices processing")
            _, inr_value = self.get_exchange_rate_inr()
            frappe.logger().info(f"Retrieved exchange rate: {inr_value}")
            inr_value = float(inr_value)
            frappe.logger().info(f"Converted exchange rate to float: {inr_value}")

            if not self.ft_premium_spices:
                frappe.logger().info("No existing rows in ft_premium_spices, appending new row")
                new_row = {
                    'eur': 0.5,
                    'inrs': 0.5 * inr_value
                }
                self.append('ft_premium_spices', new_row)
                frappe.logger().info(f"Appended new row: {new_row}")
            else:
                frappe.logger().info("Updating existing rows in ft_premium_spices")
                for row in self.ft_premium_spices:
                    frappe.logger().info(f"Processing row: {row}")
                    row.inrs = row.eur * inr_value
                    frappe.logger().info(f"Updated row.inrs to: {row.inrs}")
            
            frappe.logger().info("Completed FT Premium Spices processing")

        except Exception as e:
            frappe.log_error(message=str(e), title="FT Premium Spices Processing Error")
            frappe.throw("An error occurred while processing FT Premium Spices. Please check the error log.")
