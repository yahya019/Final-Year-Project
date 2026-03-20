package com.example.inventrack

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

class AddInventoryActivity : AppCompatActivity() {

    private lateinit var db: DBHelper

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_add_inventory)  // this is the XML you created for the form

        db = DBHelper(this)

        val etItemName = findViewById<EditText>(R.id.etItemName)
        val etQuantity = findViewById<EditText>(R.id.etQuantity)
        val etPurchasePrice = findViewById<EditText>(R.id.etPurchasePrice)
        val etSellingPrice = findViewById<EditText>(R.id.etSellingPrice)
        val btnSave = findViewById<Button>(R.id.btnSaveItem)

        btnSave.setOnClickListener {
            val name = etItemName.text.toString().trim()
            val quantity = etQuantity.text.toString().trim()
            val purchasePrice = etPurchasePrice.text.toString().trim()
            val sellingPrice = etSellingPrice.text.toString().trim()

            if (name.isEmpty() || quantity.isEmpty() || purchasePrice.isEmpty() || sellingPrice.isEmpty()) {
                Toast.makeText(this, "Please fill all fields", Toast.LENGTH_SHORT).show()
            } else {
                val success = db.insertItem(
                    name,
                    quantity.toInt(),
                    purchasePrice.toDouble(),
                    sellingPrice.toDouble()
                )

                if (success) {
                    Toast.makeText(this, "Item Added Successfully!", Toast.LENGTH_SHORT).show()

                    // Go back to Dashboard after saving
                    val intent = Intent(this, dashboard::class.java)
                    startActivity(intent)
                    finish()
                } else {
                    Toast.makeText(this, "Failed to add item", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }
}
