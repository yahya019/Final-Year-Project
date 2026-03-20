package com.example.inventrack


import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity

class dashboard : AppCompatActivity() {

    private lateinit var tvTotalItems: TextView
    private lateinit var db: DBHelper

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_dashboard)

        tvTotalItems = findViewById(R.id.tvTotalItems)
        db = DBHelper(this)
        val lowstock =findViewById<LinearLayout>(R.id.lowstock)
         val tvLowStock= findViewById<TextView>(R.id.tvLowStock)
        val totalitem = findViewById<LinearLayout>(R.id.totalitem)
        val tvMostSelling = findViewById<TextView>(R.id.tvMostSelling)
        val lowStockCount = db.getLowStockCount(5) // threshold = 5
        tvLowStock.text = lowStockCount.toString()
        totalitem.setOnClickListener {
            startActivity(Intent(this,ViewInventoryActivity::class.java))
        }

        lowstock.setOnClickListener {
            startActivity(Intent(this, lowsstockactivity ::class.java))
        }
        // Show initial total
        refreshDashboard()

        // Add Inventory button
        val btnAddInventory = findViewById<Button>(R.id.btnAddInventory)
        btnAddInventory.setOnClickListener {
            startActivity(Intent(this, AddInventoryActivity::class.java))
        }

        // View Inventory button
        val btnViewInventory = findViewById<Button>(R.id.btnViewInventory)
        btnViewInventory.setOnClickListener {
            startActivity(Intent(this, ViewInventoryActivity::class.java))
        }
        // Sell / Issue button
        val btnSellIssue = findViewById<Button>(R.id.btnSellInventory)
        btnSellIssue.setOnClickListener {
            startActivity(Intent(this, SellInventoryActivity::class.java))
        }
        val btnALlBills=findViewById<Button>(R.id.btnAllBills)
        btnALlBills.setOnClickListener {
            startActivity(Intent(this,AllBillsActivity::class.java))
        }

    }

    // ------------------- Dashboard Refresh -------------------
    fun refreshDashboard() {
        val totalItems = db.getTotalItems()
        tvTotalItems.text = totalItems.toString()
        val lowStockCount = db.getLowStockCount(5) // threshold = 5
        val tvLowStock = findViewById<TextView>(R.id.tvLowStock)
        tvLowStock.text = lowStockCount.toString()

    }
    private fun refreshMostSelling() {
        val tvMostSelling = findViewById<TextView>(R.id.tvMostSelling)
        val mostSelling = db.getMostSellingItem()
        if (mostSelling != null) {
            tvMostSelling.text = mostSelling
        } else {
            tvMostSelling.text = "No sales yet"
        }
    }
    override fun onResume() {
        super.onResume()
        refreshDashboard() // Reload total items whenever Dashboard becomes visible
        refreshMostSelling()
    }
}
