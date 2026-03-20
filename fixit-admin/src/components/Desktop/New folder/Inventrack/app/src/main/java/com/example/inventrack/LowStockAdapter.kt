package com.example.inventrack

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView

class LowStockAdapter(private val items: List<InventoryItem>) :
    RecyclerView.Adapter<LowStockAdapter.LowStockViewHolder>() {

    // ---------------- ViewHolder ----------------
    class LowStockViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val tvName: TextView = itemView.findViewById(R.id.tvItemName)
        val tvQty: TextView = itemView.findViewById(R.id.tvItemQty)
        val tvPrice: TextView = itemView.findViewById(R.id.tvItemPrice)
    }

    // ---------------- Create ----------------
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): LowStockViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_low_stock, parent, false)
        return LowStockViewHolder(view)
    }

    // ---------------- Bind ----------------
    override fun onBindViewHolder(holder: LowStockViewHolder, position: Int) {
        val item = items[position]
        holder.tvName.text = item.name
        holder.tvQty.text = "Qty: ${item.quantity}"
        holder.tvPrice.text = "₹${item.sellingPrice}"
    }

    // ---------------- Count ----------------
    override fun getItemCount(): Int = items.size
}
