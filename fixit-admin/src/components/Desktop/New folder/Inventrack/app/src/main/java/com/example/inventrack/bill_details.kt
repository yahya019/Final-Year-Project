package com.example.inventrack

import android.os.Bundle
import android.view.View
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView

class BillDetailsActivity : AppCompatActivity() {

    private lateinit var rvBillItems: RecyclerView
    private lateinit var tvNoItems: TextView
    private lateinit var dbHelper: DBHelper
    private lateinit var adapter: BillItemsAdapter

    private lateinit var tvCustomerName: TextView
    private lateinit var tvBillDate: TextView
    private lateinit var tvBillTotal: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_bill_details)

        rvBillItems = findViewById(R.id.rvBillItems)
        tvNoItems = findViewById(R.id.tvNoItems)
        tvCustomerName = findViewById(R.id.tvCustomerName)
        tvBillDate = findViewById(R.id.tvBillDate)
        tvBillTotal = findViewById(R.id.tvBillTotal)

        dbHelper = DBHelper(this)
        rvBillItems.layoutManager = LinearLayoutManager(this)

        val billId = intent.getIntExtra("BILL_ID", -1)
        if (billId != -1) {
            loadBillDetails(billId)
        } else {
            tvNoItems.text = "Invalid Bill!"
            tvNoItems.visibility = View.VISIBLE
        }
    }

    private fun loadBillDetails(billId: Int) {
        val bill = dbHelper.getBillById(billId)   // 👈 fetch bill
        val billItems = dbHelper.getBillItems(billId)

        if (bill != null) {
            tvCustomerName.text = "Customer: ${bill.customerName}"
            tvBillDate.text = "Date: ${bill.date}"
            tvBillTotal.text = "Total: ₹%.2f".format(bill.total)
        }

        if (billItems.isEmpty()) {
            tvNoItems.text = "No items found in this bill"
            tvNoItems.visibility = View.VISIBLE
            rvBillItems.visibility = View.GONE
        } else {
            tvNoItems.visibility = View.GONE
            rvBillItems.visibility = View.VISIBLE
            adapter = BillItemsAdapter(billItems)
            rvBillItems.adapter = adapter
        }
    }
}
