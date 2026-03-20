package com.example.inventrack

import android.app.AlertDialog
import android.content.Context
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.ImageButton
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.snackbar.Snackbar

class InventoryAdapter(
    private var itemList: MutableList<InventoryItem>,
    private val dbHelper: DBHelper,
    private val onUpdateList: () -> Unit
) : RecyclerView.Adapter<InventoryAdapter.InventoryViewHolder>() {

    // ✅ Master copy for search
    private var masterList: MutableList<InventoryItem> = itemList.toMutableList()

    class InventoryViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val tvItemName: TextView = itemView.findViewById(R.id.tvItemName)
        val tvItemQuantity: TextView = itemView.findViewById(R.id.tvItemQuantity)
        val tvPurchasePrice: TextView = itemView.findViewById(R.id.tvPurchasePrice)
        val tvSellingPrice: TextView = itemView.findViewById(R.id.tvSellingPrice)
        val btnEdit: ImageButton = itemView.findViewById(R.id.btnEdit)
        val btnDelete: ImageButton = itemView.findViewById(R.id.btnDelete)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): InventoryViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_inventory, parent, false)
        return InventoryViewHolder(view)
    }

    override fun onBindViewHolder(holder: InventoryViewHolder, position: Int) {
        val item = itemList[position]

        holder.tvItemName.text = item.name
        holder.tvItemQuantity.text = "Quantity: ${item.quantity}"
        holder.tvPurchasePrice.text = "Purchase Price: ₹${item.purchasePrice}"
        holder.tvSellingPrice.text = "Selling Price: ₹${item.sellingPrice}"

        // ✏️ Edit item
        holder.btnEdit.setOnClickListener {
            openEditDialog(holder.itemView.context, item, holder.adapterPosition)
        }

        // 🗑️ Delete item
        holder.btnDelete.setOnClickListener {
            AlertDialog.Builder(holder.itemView.context)
                .setTitle("Delete Item")
                .setMessage("Are you sure you want to delete '${item.name}'?")
                .setPositiveButton("Yes") { _, _ ->
                    val success = dbHelper.deleteItem(item.id)
                    if (success) {
                        val removedItem = itemList.removeAt(holder.adapterPosition)
                        masterList.removeIf { it.id == removedItem.id } // ✅ remove by ID
                        notifyItemRemoved(holder.adapterPosition)
                        onUpdateList()
                        Snackbar.make(holder.itemView, "Item deleted", Snackbar.LENGTH_SHORT).show()
                    }
                }
                .setNegativeButton("No", null)
                .show()
        }
    }

    override fun getItemCount(): Int = itemList.size

    // 🔍 Search filter
    fun filter(query: String) {
        val filteredList = if (query.isEmpty()) {
            masterList.toMutableList() // ✅ always use copy
        } else {
            masterList.filter { it.name.contains(query, ignoreCase = true) }.toMutableList()
        }
        itemList.clear()
        itemList.addAll(filteredList)
        notifyDataSetChanged()
    }

    // 🔄 Refresh adapter + master list
    fun updateList(newList: List<InventoryItem>) {
        masterList.clear()
        masterList.addAll(newList)   // ✅ keep full copy for searching
        itemList.clear()
        itemList.addAll(newList)
        notifyDataSetChanged()
    }

    // ✏️ Edit dialog
    private fun openEditDialog(context: Context, item: InventoryItem, position: Int) {
        val dialogView = LayoutInflater.from(context).inflate(R.layout.edit_item, null)
        val etName = dialogView.findViewById<EditText>(R.id.eteName)
        val etQuantity = dialogView.findViewById<EditText>(R.id.eteQuantity)
        val etPurchase = dialogView.findViewById<EditText>(R.id.etePurchasePrice)
        val etSelling = dialogView.findViewById<EditText>(R.id.eteSellingPrice)

        etName.setText(item.name)
        etQuantity.setText(item.quantity.toString())
        etPurchase.setText(item.purchasePrice.toString())
        etSelling.setText(item.sellingPrice.toString())

        AlertDialog.Builder(context)
            .setTitle("Edit Item")
            .setView(dialogView)
            .setPositiveButton("Update") { dialog, _ ->
                val newName = etName.text.toString().trim()
                val newQuantity = etQuantity.text.toString().toIntOrNull() ?: item.quantity
                val newPurchase = etPurchase.text.toString().toDoubleOrNull() ?: item.purchasePrice
                val newSelling = etSelling.text.toString().toDoubleOrNull() ?: item.sellingPrice

                val success = dbHelper.updateItem(item.id, newName, newQuantity, newPurchase, newSelling)
                if (success) {
                    val updatedItem = InventoryItem(item.id, newName, newQuantity, newPurchase, newSelling)

                    // ✅ Update both lists by ID
                    itemList[position] = updatedItem
                    val masterIndex = masterList.indexOfFirst { it.id == item.id }
                    if (masterIndex != -1) {
                        masterList[masterIndex] = updatedItem
                    }

                    notifyItemChanged(position)
                    onUpdateList()
                    Snackbar.make(dialogView, "Item updated", Snackbar.LENGTH_SHORT).show()
                }
                dialog.dismiss()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }
}
