package com.example.inventrack

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView

class AllBillsActivity : AppCompatActivity() {

    private lateinit var rvBills: RecyclerView
    private lateinit var adapter: AllBillsAdapter
    private lateinit var dbHelper: DBHelper
    private lateinit var tvNoBills: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_all_bills)

        rvBills = findViewById(R.id.rvAllBills)
        tvNoBills = findViewById(R.id.tvNoBills)
        dbHelper = DBHelper(this)

        rvBills.layoutManager = LinearLayoutManager(this)

        loadBills()
    }

    private fun loadBills() {
        val bills = dbHelper.getAllBills()
        if (bills.isEmpty()) {
            tvNoBills.text = "No bills found"
            tvNoBills.visibility = View.VISIBLE
            rvBills.visibility = View.GONE
        } else {
            tvNoBills.visibility = View.GONE
            rvBills.visibility = View.VISIBLE
            adapter = AllBillsAdapter(
                this,
                bills.toMutableList(),
                dbHelper
            ) { bill ->
                val intent = Intent(this, BillDetailsActivity::class.java)
                intent.putExtra("BILL_ID", bill.id)
                startActivity(intent)
            }
            rvBills.adapter = adapter
        }
    }


}
