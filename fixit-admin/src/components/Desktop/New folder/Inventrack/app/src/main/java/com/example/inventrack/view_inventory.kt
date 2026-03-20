package com.example.inventrack

import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import android.widget.TextView
import androidx.appcompat.widget.SearchView

class ViewInventoryActivity : AppCompatActivity() {

    private lateinit var recyclerView: RecyclerView
    private lateinit var adapter: InventoryAdapter
    private lateinit var searchView: SearchView
    private lateinit var dbHelper: DBHelper
    private lateinit var tvEmpty: TextView

    private var currentQuery: String = "" // ✅ Keep search state

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_view_inventory)

        recyclerView = findViewById(R.id.recyclerViewInventory)
        searchView = findViewById(R.id.searchViewInventory)
        tvEmpty = findViewById(R.id.tvEmpty)

        dbHelper = DBHelper(this)

        recyclerView.layoutManager = LinearLayoutManager(this)

        adapter = InventoryAdapter(mutableListOf(), dbHelper) {
            reloadItems() // only refresh affected part
        }
        recyclerView.adapter = adapter

        reloadItems()

        // ✅ Search setup
        searchView.setOnQueryTextListener(object : SearchView.OnQueryTextListener {
            override fun onQueryTextSubmit(query: String?): Boolean = false

            override fun onQueryTextChange(newText: String?): Boolean {
                currentQuery = newText ?: ""
                adapter.filter(currentQuery)
                toggleEmptyView()
                return true
            }
        })
    }

    private fun reloadItems() {
        val allItems = dbHelper.getAllItems().toMutableList()
        adapter.updateList(allItems)
        adapter.filter(currentQuery) // ✅ reapply search after edit/delete
        toggleEmptyView()
    }

    private fun toggleEmptyView() {
        tvEmpty.visibility = if (adapter.itemCount == 0) View.VISIBLE else View.GONE
    }
}
