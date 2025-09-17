import { useEffect, useState } from 'react';
import { getSales } from '../lib/sale';
import { formatCurrency } from '../lib/utils';
import { generateMultiSaleInvoice } from '../lib/saleInvoiceMulti';
import { generateReceiptPDF } from '../lib/saleReceipt';
import { Sale } from '../types/sale';
import { Product } from '../types/product';
import { getProducts } from '../lib/products';

export default function SalesManagement() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  // Filters
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [productFilter, setProductFilter] = useState('');

  useEffect(() => {
    async function fetchSales() {
      setLoading(true);
      try {
        const [data, prods] = await Promise.all([
          getSales(),
          getProducts()
        ]);
        setSales(data);
        setProducts(prods);
        setTotal(
          data.reduce((sum, s) => {
            if (typeof s.total === 'number' && !isNaN(s.total)) {
              return sum + s.total;
            }
            // fallback: calculate from products
            const productsTotal = Array.isArray(s.products)
              ? s.products.reduce((pSum, p) => pSum + (p.price * p.quantity), 0)
              : 0;
            return sum + productsTotal;
          }, 0)
        );
      } catch (e) {
        setError('Failed to load sales');
      } finally {
        setLoading(false);
      }
    }
    fetchSales();
  }, []);

  const handleInvoice = async (sale: Sale) => {
    try {
      await generateMultiSaleInvoice({
        customerName: sale.customerName,
        customerPhone: sale.customerPhone,
        products: sale.products,
        date: sale.date,
        currency: 'EGP',
      });
    } catch (e) {
      alert('Failed to generate invoice');
    }
  };

  const handleReceipt = async (sale: Sale) => {
    try {
      await generateReceiptPDF({
        customerName: sale.customerName,
        customerPhone: sale.customerPhone,
        products: sale.products,
        date: sale.date,
        currency: 'EGP',
        total: typeof sale.total === 'number' ? sale.total : sale.products.reduce((sum, p) => sum + (p.price * p.quantity), 0),
      });
    } catch (e) {
      alert('Failed to generate receipt');
    }
  };

  // Filter and sort sales
  const filteredSales = sales
    .filter(sale => {
      // Search by customer name, phone, or product name
      const searchLower = search.trim().toLowerCase();
      const matchesSearch =
        !searchLower ||
        sale.customerName.toLowerCase().includes(searchLower) ||
        sale.customerPhone.includes(searchLower) ||
        sale.products.some(p => p.name.toLowerCase().includes(searchLower));
      // Date filter
      const saleDate = new Date(sale.date);
      const matchesFrom = !dateFrom || saleDate >= new Date(dateFrom);
      const matchesTo = !dateTo || saleDate <= new Date(dateTo);
      // Product filter
      const matchesProduct = !productFilter || sale.products.some(p => p.productId === productFilter);
      return matchesSearch && matchesFrom && matchesTo && matchesProduct;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-lg p-8 mb-6">
        <h2 className="text-4xl font-bold mb-6 flex items-center gap-3 bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
          🛒 Sales Management
          <span className="text-lg text-slate-600 font-normal bg-slate-100 px-4 py-2 rounded-full">
            ({filteredSales.length} results)
          </span>
        </h2>
        <div className="flex flex-wrap gap-4 items-center">
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
            <input
              type="text"
              placeholder="🔍 Search by customer, phone, or product..."
              className="border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg px-4 py-3 text-slate-800 placeholder-slate-500 bg-white transition-all duration-200 min-w-[250px]"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
            <label className="block text-xs font-bold text-slate-700 mb-2">From Date</label>
            <input type="date" className="border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg px-4 py-3 text-slate-800 bg-white transition-all duration-200" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
            <label className="block text-xs font-bold text-slate-700 mb-2">To Date</label>
            <input type="date" className="border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg px-4 py-3 text-slate-800 bg-white transition-all duration-200" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
            <label className="block text-xs font-bold text-slate-700 mb-2">Product Filter</label>
            <select className="border-2 border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 focus:ring-2 rounded-lg px-4 py-3 text-slate-800 bg-white transition-all duration-200" value={productFilter} onChange={e => setProductFilter(e.target.value)}>
              <option value="">All Products</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="ml-auto bg-green-50 border border-green-200 px-6 py-4 rounded-xl">
            <span className="font-bold text-xl text-green-700">
              💰 Total: {formatCurrency(total, 'EGP')}
            </span>
          </div>
        </div>
      </div>
      {loading ? (
        <div className="text-center py-12">
          <div className="bg-white/95 backdrop-blur-sm border border-slate-200 inline-block p-8 rounded-2xl shadow-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
            <p className="text-slate-600 text-lg font-medium">Loading sales data...</p>
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="bg-white/95 backdrop-blur-sm border border-red-200 inline-block p-8 rounded-2xl shadow-lg bg-red-50">
            <p className="text-red-600 text-lg font-medium">❌ {error}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSales.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-white/95 backdrop-blur-sm border border-slate-200 inline-block p-8 rounded-2xl shadow-lg">
                <p className="text-slate-600 text-lg font-medium">🔍 No sales found matching your criteria</p>
              </div>
            </div>
          ) : (
            filteredSales.map((sale, index) => (
              <div key={sale.id} className="bg-white/95 backdrop-blur-sm border border-slate-200 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.01] animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-center">
                  <div className="lg:col-span-1">
                    <div className="text-sm text-slate-600 font-medium mb-1">Date & Time</div>
                    <div className="text-slate-900 font-semibold">
                      {new Date(sale.date).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}
                    </div>
                  </div>
                  <div className="lg:col-span-1">
                    <div className="text-sm text-slate-600 font-medium mb-1">Customer</div>
                    <div className="text-slate-900 font-bold text-lg">{sale.customerName}</div>
                  </div>
                  <div className="lg:col-span-1">
                    <div className="text-sm text-slate-600 font-medium mb-1">Phone</div>
                    <div className="text-slate-700 font-medium">{sale.customerPhone}</div>
                  </div>
                  <div className="lg:col-span-1">
                    <div className="text-sm text-slate-600 font-medium mb-1">Products</div>
                    <div className="text-slate-700">
                      <ul className="text-sm space-y-1">
                        {sale.products.slice(0, 2).map(p => (
                          <li key={p.productId} className="flex justify-between">
                            <span>{p.name}</span>
                            <span className="text-slate-500">x{p.quantity}</span>
                          </li>
                        ))}
                        {sale.products.length > 2 && (
                          <li className="text-slate-500">+{sale.products.length - 2} more...</li>
                        )}
                      </ul>
                    </div>
                  </div>
                  <div className="lg:col-span-1 flex items-center justify-between">
                    <div>
                      <div className="text-sm text-slate-600 font-medium mb-1">Total</div>
                      <div className="text-green-600 font-bold text-xl">
                        {formatCurrency(sale.total, 'EGP')}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 shadow-md"
                        onClick={() => handleInvoice(sale)}
                      >
                        📄 Invoice
                      </button>
                      <button
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 shadow-md"
                        onClick={() => handleReceipt(sale)}
                      >
                        🧾 Receipt
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
