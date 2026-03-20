package com.example.inventrack

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView

class BillItemsAdapter(private val items: List<BillItem>) :
    RecyclerView.Adapter<BillItemsAdapter.BillItemViewHolder>() {

    class BillItemViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val tvItemName: TextView = itemView.findViewById(R.id.tvItemName)
        val tvItemQty: TextView = itemView.findViewById(R.id.tvQuantity)   // fixed
        val tvItemPrice: TextView = itemView.findViewById(R.id.tvPrice)   // fixed
        val tvItemSubtotal: TextView = itemView.findViewById(R.id.tvSubtotal) // fixed
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): BillItemViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_bill_item, parent, false)
        return BillItemViewHolder(view)
    }

    override fun onBindViewHolder(holder: BillItemViewHolder, position: Int) {
        val item = items[position]
        holder.tvItemName.text = item.itemName
        holder.tvItemQty.text = "Qty: ${item.quantity}"
        holder.tvItemPrice.text = "Price: ₹%.2f".format(item.price)
        holder.tvItemSubtotal.text = "Subtotal: ₹%.2f".format(item.subtotal)
    }

    override fun getItemCount(): Int = items.size
}
