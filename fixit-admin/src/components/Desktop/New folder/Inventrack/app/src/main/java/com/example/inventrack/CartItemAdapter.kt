package com.example.inventrack

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView

class CartItemAdapter(private val items: List<CartItem>) :
    RecyclerView.Adapter<CartItemAdapter.CartViewHolder>() {

    class CartViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val tvItemName: TextView = itemView.findViewById(R.id.tvItemName)
        val tvQuantity: TextView = itemView.findViewById(R.id.tvItemQty)
        val tvPrice: TextView = itemView.findViewById(R.id.tvItemPrice)
        val tvSubtotal: TextView = itemView.findViewById(R.id.tvItemSubtotal) // New
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): CartViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.bill_item, parent, false)
        return CartViewHolder(view)
    }

    override fun onBindViewHolder(holder: CartViewHolder, position: Int) {
        val item = items[position]
        holder.tvItemName.text = item.itemName
        holder.tvQuantity.text = "Qty: ${item.quantity}"
        holder.tvPrice.text = "₹%.2f".format(item.price)
        holder.tvSubtotal.text = "₹%.2f".format(item.quantity * item.price) // Subtotal
    }

    override fun getItemCount(): Int = items.size
}
