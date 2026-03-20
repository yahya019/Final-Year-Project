package com.example.inventrack

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.recyclerview.widget.RecyclerView
import com.example.inventrack.R
import com.google.android.material.button.MaterialButton

class SellAdapter(
    private val items: List<InventoryItem>,
    private val addToCart: (InventoryItem, Int) -> Unit
) : RecyclerView.Adapter<SellAdapter.SellViewHolder>() {

    inner class SellViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val tvName: TextView = itemView.findViewById(R.id.tvItemName)
        val tvPrice: TextView = itemView.findViewById(R.id.tvItemPrice)
        val tvQuantity: TextView = itemView.findViewById(R.id.tvItemQty)
        val btnAdd: TextView = itemView.findViewById(R.id.btnAddCart)
        val btnPlus: TextView = itemView.findViewById(R.id.btnPlus)
        val btnMinus: TextView = itemView.findViewById(R.id.btnMinus)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): SellViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_sell, parent, false)
        return SellViewHolder(view)
    }

    override fun onBindViewHolder(holder: SellViewHolder, position: Int) {
        val item = items[position]
        holder.tvName.text = item.name
        holder.tvPrice.text = "₹%.2f".format(item.sellingPrice)
        holder.tvQuantity.text = "0" // default quantity

        // Increase quantity
        holder.btnPlus.setOnClickListener {
            var qty = holder.tvQuantity.text.toString().toIntOrNull() ?: 1
            if (qty < item.quantity) {
                qty++
                holder.tvQuantity.text = qty.toString()
            }else {
                // 🚨 Toast if trying to add more than stock
                Toast.makeText(holder.itemView.context,
                    "Only ${item.quantity} items in stock",
                    Toast.LENGTH_SHORT).show()
            }
        }

        // Decrease quantity
        holder.btnMinus.setOnClickListener {
            var qty = holder.tvQuantity.text.toString().toIntOrNull() ?: 1
            if (qty > 1) {
                qty--
                holder.tvQuantity.text = qty.toString()
            } else {
                // 🚨 Toast if trying to reduce to 0 or below
                Toast.makeText(holder.itemView.context,
                    "Quantity cannot be less than 1",
                    Toast.LENGTH_SHORT).show()
            }
        }

        // Add to cart
        holder.btnAdd.setOnClickListener {
            val qty = holder.tvQuantity.text.toString().toIntOrNull() ?: 0
            if (qty <= 0) return@setOnClickListener

            if (qty > item.quantity) {
                holder.itemView.context.toast("Not enough stock!")
                return@setOnClickListener
            }

            addToCart(item, qty)
            holder.tvQuantity.text = "0" // reset quantity after adding
        }
    }

    override fun getItemCount(): Int = items.size
}

// Extension function for quick Toast
fun android.content.Context.toast(message: String) {
    android.widget.Toast.makeText(this, message, android.widget.Toast.LENGTH_SHORT).show()
}
