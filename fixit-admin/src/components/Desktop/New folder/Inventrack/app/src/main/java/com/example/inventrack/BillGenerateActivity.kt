package com.example.inventrack

import android.content.Intent
import android.os.Bundle
import android.widget.EditText
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.button.MaterialButton
import java.text.SimpleDateFormat
import java.util.*

class BillGenerateActivity : AppCompatActivity() {

    private lateinit var rvBillItems: RecyclerView
    private lateinit var tvTotal: TextView
    private lateinit var etCustomerName: EditText
    private lateinit var btnSave: MaterialButton
    private lateinit var btnShare: MaterialButton

    private var cartItems = listOf<CartItem>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_bill_generate)

        rvBillItems = findViewById(R.id.rvBillItems)
        tvTotal = findViewById(R.id.tvTotal)
        etCustomerName = findViewById(R.id.etCustomerName)
        btnSave = findViewById(R.id.btnSave)
        btnShare = findViewById(R.id.btnShare)

        cartItems = intent.getSerializableExtra("cartItems") as? List<CartItem> ?: listOf()

        rvBillItems.layoutManager = LinearLayoutManager(this)
        rvBillItems.adapter = CartItemAdapter(cartItems)

        val totalAmount = cartItems.sumOf { it.price * it.quantity }
        tvTotal.text = "Total: ₹%.2f".format(totalAmount)

        btnSave.setOnClickListener {
            saveBill()

        }

        btnShare.setOnClickListener {
            shareBill()
        }
    }

    private fun saveBill() {
        val customerName = etCustomerName.text.toString().ifEmpty { "Walk-in Customer" }
        val date = SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.getDefault()).format(Date())
        // Save bill in DB
val dbHelper=DBHelper(this)
        val totalAmount = cartItems.sumOf { it.price * it.quantity }
        val billId = DBHelper(this).insertBill(customerName, date, totalAmount).toInt()

        cartItems.forEach {
            dbHelper.insertBillItem(billId, it.id, it.itemName, it.quantity, it.price)
            dbHelper.updateInventoryQuantity(it.id, -it.quantity)
        }

        dbHelper.updateBillTotal(billId, cartItems.sumOf { it.price * it.quantity })
        finish()

    }

private fun shareBill() {
    val customerName = etCustomerName.text.toString().ifEmpty { "Walk-in Customer" }
    val date = SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.getDefault()).format(Date())

    val billText = StringBuilder()
    billText.append("🧾 Invoice\n")
    billText.append("Customer: $customerName\n")
    billText.append("Date: $date\n\nItems:\n")

    cartItems.forEach {
        val subtotal = it.price * it.quantity
        billText.append("${it.itemName} ₹${it.price} x${it.quantity} = ₹${subtotal}\n")
    }

    val totalAmount = cartItems.sumOf { it.price * it.quantity }
    billText.append("\nTotal: ₹%.2f".format(totalAmount))

    val intent = Intent(Intent.ACTION_SEND)
    intent.type = "text/plain"
    intent.putExtra(Intent.EXTRA_TEXT, billText.toString())
    startActivity(Intent.createChooser(intent, "Share Bill"))
}

}
