package com.example.inventrack

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import java.io.Serializable

// ------------------- DATABASE HELPER -------------------
class DBHelper(context: Context) : SQLiteOpenHelper(context, DATABASE_NAME, null, DATABASE_VERSION) {

    companion object {
        private const val DATABASE_NAME = "InventrackDB.db"
        private const val DATABASE_VERSION = 5

        // Users Table
        private const val TABLE_USERS = "Users"
        private const val COL_ID = "id"
        private const val COL_USERNAME = "username"
        private const val COL_EMAIL = "email"
        private const val COL_PASSWORD = "password"

        // Inventory Table
        private const val TABLE_INVENTORY = "Inventory"
        private const val COL_ITEM_ID = "id"
        private const val COL_ITEM_NAME = "name"
        private const val COL_QUANTITY = "quantity"
        private const val COL_PURCHASE_PRICE = "purchase_price"
        private const val COL_SELLING_PRICE = "selling_price"

        // Bills Table
        private const val TABLE_BILLS = "Bills"
        private const val COL_BILL_ID = "id"
        private const val COL_CUSTOMER = "customer_name"
        private const val COL_DATE = "date"
        private const val COL_TOTAL = "total"

        // BillItems Table
        const val TABLE_BILL_ITEMS = "BillItems"
        const val COL_BILL_ITEM_ID = "id"
        const val COL_BILL_ID_FK = "billId"
        const val COL_ITEM_ID_FK = "itemId"
        const val COL_BILL_ITEM_NAME = "itemName"   // ✅ added
        const val COL_QTY = "quantity"
        const val COL_PRICE = "price"
        const val COL_SUBTOTAL = "subtotal"
    }

    override fun onCreate(db: SQLiteDatabase) {
        // Users Table
        db.execSQL(
            """
            CREATE TABLE $TABLE_USERS (
                $COL_ID INTEGER PRIMARY KEY AUTOINCREMENT,
                $COL_USERNAME TEXT UNIQUE NOT NULL,
                $COL_EMAIL TEXT NOT NULL,
                $COL_PASSWORD TEXT NOT NULL
            )
        """
        )

        // Inventory Table
        db.execSQL(
            """
            CREATE TABLE $TABLE_INVENTORY (
                $COL_ITEM_ID INTEGER PRIMARY KEY AUTOINCREMENT,
                $COL_ITEM_NAME TEXT NOT NULL,
                $COL_QUANTITY INTEGER NOT NULL,
                $COL_PURCHASE_PRICE REAL NOT NULL,
                $COL_SELLING_PRICE REAL NOT NULL
            )
        """
        )

        // Bills Table
        db.execSQL(
            """
            CREATE TABLE $TABLE_BILLS (
                $COL_BILL_ID INTEGER PRIMARY KEY AUTOINCREMENT,
                $COL_CUSTOMER TEXT NOT NULL,
                $COL_DATE TEXT NOT NULL,
                $COL_TOTAL REAL NOT NULL
            )
        """
        )

        // BillItems Table
        db.execSQL("""
    CREATE TABLE $TABLE_BILL_ITEMS (
        $COL_BILL_ITEM_ID INTEGER PRIMARY KEY AUTOINCREMENT,
        $COL_BILL_ID_FK INTEGER,
        $COL_ITEM_ID_FK INTEGER,
        $COL_BILL_ITEM_NAME TEXT,
        $COL_QTY INTEGER,
        $COL_PRICE REAL,
        $COL_SUBTOTAL REAL,
        FOREIGN KEY($COL_BILL_ID_FK) REFERENCES $TABLE_BILLS($COL_BILL_ID),
        FOREIGN KEY($COL_ITEM_ID_FK) REFERENCES $TABLE_INVENTORY($COL_ITEM_ID)
    )
    """
        )

    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        db.execSQL("DROP TABLE IF EXISTS $TABLE_USERS")
        db.execSQL("DROP TABLE IF EXISTS $TABLE_INVENTORY")
        db.execSQL("DROP TABLE IF EXISTS $TABLE_BILLS")
        db.execSQL("DROP TABLE IF EXISTS $TABLE_BILL_ITEMS")
        onCreate(db)
    }

    // ---------------- USER FUNCTIONS ----------------
    fun insertUser(username: String, email: String, password: String): Boolean {
        val db = writableDatabase
        val cursor = db.rawQuery(
            "SELECT * FROM $TABLE_USERS WHERE $COL_USERNAME = ? OR $COL_EMAIL = ?",
            arrayOf(username, email)
        )
        if (cursor.count > 0) {
            cursor.close(); return false
        }
        cursor.close()
        val values = ContentValues().apply {
            put(COL_USERNAME, username)
            put(COL_EMAIL, email)
            put(COL_PASSWORD, password)
        }
        val result = db.insert(TABLE_USERS, null, values)
        db.close()
        return result != -1L
    }

    fun checkUser(usernameOrEmail: String, password: String): Boolean {
        val db = readableDatabase
        val cursor = db.rawQuery(
            "SELECT * FROM $TABLE_USERS WHERE ($COL_USERNAME=? OR $COL_EMAIL=?) AND $COL_PASSWORD=?",
            arrayOf(usernameOrEmail, usernameOrEmail, password)
        )
        val exists = cursor.count > 0
        cursor.close()
        db.close()
        return exists
    }

    // ---------------- INVENTORY FUNCTIONS ----------------
    fun insertItem(
        name: String,
        quantity: Int,
        purchasePrice: Double,
        sellingPrice: Double
    ): Boolean {
        val db = writableDatabase
        val values = ContentValues().apply {
            put(COL_ITEM_NAME, name)
            put(COL_QUANTITY, quantity)
            put(COL_PURCHASE_PRICE, purchasePrice)
            put(COL_SELLING_PRICE, sellingPrice)
        }
        val result = db.insert(TABLE_INVENTORY, null, values)
        db.close()
        return result != -1L
    }

    fun getAllItems(): List<InventoryItem> {
        val itemList = mutableListOf<InventoryItem>()
        val db = readableDatabase
        val cursor = db.rawQuery("SELECT * FROM $TABLE_INVENTORY", null)
        if (cursor.moveToFirst()) {
            do {
                itemList.add(
                    InventoryItem(
                        id = cursor.getInt(cursor.getColumnIndexOrThrow(COL_ITEM_ID)),
                        name = cursor.getString(cursor.getColumnIndexOrThrow(COL_ITEM_NAME)),
                        quantity = cursor.getInt(cursor.getColumnIndexOrThrow(COL_QUANTITY)),
                        purchasePrice = cursor.getDouble(
                            cursor.getColumnIndexOrThrow(
                                COL_PURCHASE_PRICE
                            )
                        ),
                        sellingPrice = cursor.getDouble(
                            cursor.getColumnIndexOrThrow(
                                COL_SELLING_PRICE
                            )
                        )
                    )
                )
            } while (cursor.moveToNext())
        }
        cursor.close()
        db.close()
        return itemList
    }

    fun updateInventoryQuantity(itemId: Int, changeQty: Int): Boolean {
        val db = writableDatabase
        val cursor = db.rawQuery(
            "SELECT $COL_QUANTITY FROM $TABLE_INVENTORY WHERE $COL_ITEM_ID=?",
            arrayOf(itemId.toString())
        )
        if (!cursor.moveToFirst()) {
            cursor.close(); db.close(); return false
        }
        val newQty = cursor.getInt(0) + changeQty
        cursor.close()
        val values = ContentValues().apply { put(COL_QUANTITY, newQty) }
        val rows = db.update(TABLE_INVENTORY, values, "$COL_ITEM_ID=?", arrayOf(itemId.toString()))
        db.close()
        return rows > 0
    }

    // ---------------- BILL FUNCTIONS ----------------
    fun insertBill(customerName: String, date: String, total: Double): Long {
        val db = writableDatabase
        val values = ContentValues().apply {
            put(COL_CUSTOMER, customerName)
            put(COL_DATE, date)
            put(COL_TOTAL, total)
        }
        return db.insert(TABLE_BILLS, null, values)
    }


    // ✅ Insert Bill Item
    fun insertBillItem(
        billId: Int,
        itemId: Int,
        itemName: String,
        quantity: Int,
        price: Double
    ): Long {
        val db = writableDatabase
        val subtotal = price * quantity
        val values = ContentValues().apply {
            put(COL_BILL_ID_FK, billId)
            put(COL_ITEM_ID_FK, itemId)
            put(COL_BILL_ITEM_NAME, itemName)   // ✅ save item name
            put(COL_QTY, quantity)
            put(COL_PRICE, price)
            put(COL_SUBTOTAL, subtotal)
        }
        return db.insert(TABLE_BILL_ITEMS, null, values)
    }


    fun getAllBills(): List<Bill> {
        val bills = mutableListOf<Bill>()
        val db = readableDatabase
        val cursor = db.rawQuery("SELECT * FROM $TABLE_BILLS ORDER BY $COL_BILL_ID DESC", null)
        if (cursor.moveToFirst()) {
            do {
                bills.add(
                    Bill(
                        id = cursor.getInt(cursor.getColumnIndexOrThrow(COL_BILL_ID)),
                        customerName = cursor.getString(cursor.getColumnIndexOrThrow(COL_CUSTOMER)),
                        date = cursor.getString(cursor.getColumnIndexOrThrow(COL_DATE)),
                        total = cursor.getDouble(cursor.getColumnIndexOrThrow(COL_TOTAL))
                    )
                )
            } while (cursor.moveToNext())
        }
        cursor.close()
        db.close()
        return bills
    }

    fun updateBillTotal(billId: Int, total: Double): Boolean {
        val db = writableDatabase
        val values = ContentValues().apply {
            put(COL_TOTAL, total)
        }
        val rows = db.update(TABLE_BILLS, values, "$COL_BILL_ID=?", arrayOf(billId.toString()))
        db.close()
        return rows > 0
    }

    // Update an existing inventory item
    fun updateItem(
        itemId: Int,
        name: String,
        quantity: Int,
        purchasePrice: Double,
        sellingPrice: Double
    ): Boolean {
        val db = writableDatabase
        val values = ContentValues().apply {
            put(COL_ITEM_NAME, name)
            put(COL_QUANTITY, quantity)
            put(COL_PURCHASE_PRICE, purchasePrice)
            put(COL_SELLING_PRICE, sellingPrice)
        }
        val rows = db.update(TABLE_INVENTORY, values, "$COL_ITEM_ID=?", arrayOf(itemId.toString()))
        db.close()
        return rows > 0
    }

    // Delete an inventory item
    fun deleteItem(itemId: Int): Boolean {
        val db = writableDatabase
        val rows = db.delete(TABLE_INVENTORY, "$COL_ITEM_ID=?", arrayOf(itemId.toString()))
        db.close()
        return rows > 0
    }

    // Get total number of items in inventory
    fun getTotalItems(): Int {
        val db = readableDatabase
        val cursor = db.rawQuery("SELECT COUNT(*) FROM $TABLE_INVENTORY", null)
        var total = 0
        if (cursor.moveToFirst()) {
            total = cursor.getInt(0)
        }
        cursor.close()
        db.close()
        return total
    }

    // Get count of low stock items (quantity <= threshold)
    fun getLowStockCount(threshold: Int = 5): Int {
        val db = readableDatabase
        val cursor = db.rawQuery(
            "SELECT COUNT(*) FROM $TABLE_INVENTORY WHERE $COL_QUANTITY <= ?",
            arrayOf(threshold.toString())
        )
        var count = 0
        if (cursor.moveToFirst()) {
            count = cursor.getInt(0)
        }
        cursor.close()
        db.close()
        return count
    }

    // Get list of low stock items (if you want to display them)
    fun getLowStockItems(threshold: Int = 5): List<InventoryItem> {
        val itemList = mutableListOf<InventoryItem>()
        val db = readableDatabase
        val cursor = db.rawQuery(
            "SELECT * FROM $TABLE_INVENTORY WHERE $COL_QUANTITY <= ?",
            arrayOf(threshold.toString())
        )
        if (cursor.moveToFirst()) {
            do {
                itemList.add(
                    InventoryItem(
                        id = cursor.getInt(cursor.getColumnIndexOrThrow(COL_ITEM_ID)),
                        name = cursor.getString(cursor.getColumnIndexOrThrow(COL_ITEM_NAME)),
                        quantity = cursor.getInt(cursor.getColumnIndexOrThrow(COL_QUANTITY)),
                        purchasePrice = cursor.getDouble(
                            cursor.getColumnIndexOrThrow(
                                COL_PURCHASE_PRICE
                            )
                        ),
                        sellingPrice = cursor.getDouble(
                            cursor.getColumnIndexOrThrow(
                                COL_SELLING_PRICE
                            )
                        )
                    )
                )
            } while (cursor.moveToNext())
        }
        cursor.close()
        db.close()
        return itemList
    }

    fun getBillItems(billId: Int): List<BillItem> {
        val db = readableDatabase
        val items = mutableListOf<BillItem>()

        val query = """
        SELECT $COL_BILL_ITEM_ID, $COL_BILL_ID_FK, $COL_BILL_ITEM_NAME, 
               $COL_QTY, $COL_PRICE, $COL_SUBTOTAL
        FROM $TABLE_BILL_ITEMS
        WHERE $COL_BILL_ID_FK = ?
    """
        val cursor = db.rawQuery(query, arrayOf(billId.toString()))

        if (cursor.moveToFirst()) {
            do {
                val id = cursor.getInt(cursor.getColumnIndexOrThrow(COL_BILL_ITEM_ID))
                val billIdFk = cursor.getInt(cursor.getColumnIndexOrThrow(COL_BILL_ID_FK))
                val itemName = cursor.getString(cursor.getColumnIndexOrThrow(COL_BILL_ITEM_NAME))
                val quantity = cursor.getInt(cursor.getColumnIndexOrThrow(COL_QTY))
                val price = cursor.getDouble(cursor.getColumnIndexOrThrow(COL_PRICE))
                val subtotal = cursor.getDouble(cursor.getColumnIndexOrThrow(COL_SUBTOTAL))

                items.add(BillItem(id, billIdFk, itemName, quantity, price, subtotal))
            } while (cursor.moveToNext())
        }

        cursor.close()
        db.close()
        return items
    }


    fun deleteBill(billId: Int): Boolean {
        val db = this.writableDatabase

        // Delete bill items linked to this bill
        db.delete(TABLE_BILL_ITEMS, "$COL_BILL_ID_FK=?", arrayOf(billId.toString()))
// Delete the bill itself
        val rowsDeleted = db.delete(TABLE_BILLS, "$COL_BILL_ID=?", arrayOf(billId.toString()))
        db.close()
        return rowsDeleted > 0
    }

    fun getBillById(billId: Int): Bill? {
        val db = readableDatabase
        val cursor = db.rawQuery(
            "SELECT * FROM $TABLE_BILLS WHERE $COL_BILL_ID = ?",
            arrayOf(billId.toString())
        )

        var bill: Bill? = null
        if (cursor.moveToFirst()) {
            val id = cursor.getInt(cursor.getColumnIndexOrThrow(COL_BILL_ID))
            val customer = cursor.getString(cursor.getColumnIndexOrThrow(COL_CUSTOMER))
            val date = cursor.getString(cursor.getColumnIndexOrThrow(COL_DATE))
            val total = cursor.getDouble(cursor.getColumnIndexOrThrow(COL_TOTAL))
            bill = Bill(id, customer, date, total)
        }
        cursor.close()
        return bill
    }
    fun getMostSellingItem(): String? {
        val db = readableDatabase
        var mostSellingItem: String? = null

        val query = """
        SELECT $COL_BILL_ITEM_NAME, SUM($COL_QTY) as totalQty
        FROM $TABLE_BILL_ITEMS
        GROUP BY $COL_BILL_ITEM_NAME
        ORDER BY totalQty DESC
        LIMIT 1
    """

        val cursor = db.rawQuery(query, null)
        if (cursor.moveToFirst()) {
            mostSellingItem = cursor.getString(cursor.getColumnIndexOrThrow(COL_BILL_ITEM_NAME))
        }

        cursor.close()
        db.close()
        return mostSellingItem
    }

}
// ---------------- DATA MODELS ----------------
data class InventoryItem(
    val id: Int,
    val name: String,
    val quantity: Int,
    val purchasePrice: Double,
    val sellingPrice: Double
) : Serializable

data class CartItem(
    val id: Int,
    val itemName: String,
    var quantity: Int,
    val price: Double
) : Serializable

data class Bill(
    val id: Int,
    val customerName: String,
    val date: String,
    val total: Double
) : Serializable

data class BillItem(
    val id: Int,
    val billId: Int,
    val itemName: String,
    val quantity: Int,
    val price: Double,
    val subtotal: Double
)





