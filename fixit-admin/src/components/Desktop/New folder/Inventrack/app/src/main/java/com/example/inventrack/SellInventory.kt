package com.example.inventrack

import android.content.Intent
import android.os.Bundle
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.widget.SearchView
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.button.MaterialButton

class SellInventoryActivity : AppCompatActivity() {

    private lateinit var dbHelper: DBHelper
    private lateinit var adapter: SellAdapter
    private lateinit var cartSummary: TextView
    private lateinit var btnCheckout: MaterialButton
    private lateinit var searchView: SearchView

    private val cartList = mutableListOf<CartItem>()
    private var inventoryList = listOf<InventoryItem>()
    private var filteredList = mutableListOf<InventoryItem>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_sell_inventory)

        dbHelper = DBHelper(this)

        searchView = findViewById(R.id.searchViewInventory)
        val rvInventory = findViewById<RecyclerView>(R.id.rvInventoryList)
        cartSummary = findViewById(R.id.tvCartSummary)
        btnCheckout = findViewById(R.id.btnCheckout)

        rvInventory.layoutManager = LinearLayoutManager(this)

        inventoryList = dbHelper.getAllItems()
        filteredList.addAll(inventoryList)

        adapter = SellAdapter(filteredList) { item, qty -> addToCart(item, qty) }
        rvInventory.adapter = adapter

        setupSearch()

        btnCheckout.setOnClickListener {
            if (cartList.isEmpty()) {
                Toast.makeText(this, "Cart is empty!", Toast.LENGTH_SHORT).show()
            } else {
                goToBillGenerate()
            }
        }
    }

    private fun setupSearch() {
        searchView.setOnQueryTextListener(object : SearchView.OnQueryTextListener {
            override fun onQueryTextSubmit(query: String?): Boolean = false

            override fun onQueryTextChange(newText: String?): Boolean {
                filteredList.clear()
                if (newText.isNullOrEmpty()) {
                    filteredList.addAll(inventoryList)
                } else {
                    filteredList.addAll(
                        inventoryList.filter { it.name.contains(newText, ignoreCase = true) }
                    )
                }
                adapter.notifyDataSetChanged()
                return true
            }
        })
    }

    private fun addToCart(item: InventoryItem, qty: Int) {
        if (qty > item.quantity) {
            Toast.makeText(this, "Not enough stock!", Toast.LENGTH_SHORT).show()
            return
        }

        // Check if item already in cart
        val existingItem = cartList.find { it.id == item.id }
        if (existingItem != null) {
            existingItem.quantity += qty
        } else {
            cartList.add(CartItem(item.id, item.name, qty, item.sellingPrice))
        }

        cartSummary.text = "Cart: ${cartList.size} items"
        Toast.makeText(this, "${item.name} x$qty added to cart", Toast.LENGTH_SHORT).show()


    }

    private fun goToBillGenerate() {
        val intent = Intent(this, BillGenerateActivity::class.java)
        intent.putExtra("cartItems", ArrayList(cartList))
        startActivity(intent)
    }
}
