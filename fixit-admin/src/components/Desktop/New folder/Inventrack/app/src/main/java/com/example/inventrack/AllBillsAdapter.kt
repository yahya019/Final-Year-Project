package com.example.inventrack

import android.app.AlertDialog
import android.content.Context
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.ImageButton
import android.widget.TextView
import android.widget.Toast
import androidx.recyclerview.widget.RecyclerView

class AllBillsAdapter(
    private val context: Context,
    private var bills: MutableList<Bill>,   // ✅ Mutable list so we can remove items
    private val dbHelper: DBHelper,         // ✅ DBHelper to delete bills
    private val onBillClick: (Bill) -> Unit // ✅ Callback for opening bill details
) : RecyclerView.Adapter<AllBillsAdapter.BillViewHolder>() {

    class BillViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val tvBillId: TextView = itemView.findViewById(R.id.tvBillId)
        val tvCustomer: TextView = itemView.findViewById(R.id.tvCustomer)
        val tvTotal: TextView = itemView.findViewById(R.id.tvTotal)
        val btnDelete: ImageButton = itemView.findViewById(R.id.btnDelete)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): BillViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_bill_summary, parent, false)
        return BillViewHolder(view)
    }

    override fun onBindViewHolder(holder: BillViewHolder, position: Int) {
        val bill = bills[position]

        holder.tvBillId.text = "Bill ID: ${bill.id}"
        holder.tvCustomer.text = "Customer: ${bill.customerName}"
        holder.tvTotal.text = "Total: ₹%.2f".format(bill.total)

        // 👆 Open bill details when card clicked
        holder.itemView.setOnClickListener { onBillClick(bill) }

        // 👇 Delete button logic
        holder.btnDelete.setOnClickListener {
            AlertDialog.Builder(context)
                .setTitle("Delete Bill")
                .setMessage("Are you sure you want to delete Bill ID: ${bill.id}?")
                .setPositiveButton("Yes") { _, _ ->
                    val deleted = dbHelper.deleteBill(bill.id)
                    if (deleted) {
                        bills.removeAt(position)
                        notifyItemRemoved(position)
                        notifyItemRangeChanged(position, bills.size)
                        Toast.makeText(context, "Bill deleted", Toast.LENGTH_SHORT).show()
                    } else {
                        Toast.makeText(context, "Failed to delete bill", Toast.LENGTH_SHORT).show()
                    }
                }
                .setNegativeButton("No", null)
                .show()
        }
    }

    override fun getItemCount(): Int = bills.size
}
