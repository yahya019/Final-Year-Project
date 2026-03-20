package com.example.inventrack

import android.os.Bundle
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView

class lowsstockactivity : AppCompatActivity() {

    private lateinit var db: DBHelper
    private lateinit var rvLowStock: RecyclerView
    private lateinit var adapter: LowStockAdapter
    private lateinit var tvTitle: TextView
    private lateinit var btnBack: com.google.android.material.button.MaterialButton

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_lowsstockactivity)

        db = DBHelper(this)
        rvLowStock = findViewById(R.id.rvLowStock)
        tvTitle = findViewById(R.id.tvLowStockTitle)
        btnBack = findViewById(R.id.btnBackDashboard)

        val items = db.getLowStockItems(5) // threshold = 5
        tvTitle.text = "Low Stock Items (${items.size})"

        adapter = LowStockAdapter(items)
        rvLowStock.layoutManager = LinearLayoutManager(this)
        rvLowStock.adapter = adapter

        btnBack.setOnClickListener {
            finish() // goes back to dashboard
        }
    }
}
