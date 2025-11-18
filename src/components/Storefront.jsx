import { useEffect, useState } from 'react'

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function ProductCard({ product, onAdd }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col">
      <div className="aspect-square w-full overflow-hidden rounded-lg bg-slate-800">
        {product.image_url ? (
          <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">Sin imagen</div>
        )}
      </div>
      <div className="mt-3">
        <h3 className="text-white font-semibold truncate">{product.title}</h3>
        <p className="text-slate-300/80 text-sm line-clamp-2 min-h-[2.5rem]">{product.description}</p>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-blue-300 font-bold">${product.price.toFixed(2)}</span>
        <button onClick={onAdd} className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm">Agregar</button>
      </div>
    </div>
  )
}

function CartDrawer({ open, onClose, cart, onRemove, onQty }) {
  const items = cart?.items || []
  const total = items.reduce((sum, it) => sum + it.unit_price * it.quantity, 0)
  return (
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`}>
      <div className={`absolute inset-0 bg-black/50 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
      <div className={`absolute right-0 top-0 h-full w-full sm:w-[420px] bg-slate-900 border-l border-white/10 p-4 transition-transform ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold text-lg">Tu carrito</h2>
          <button onClick={onClose} className="text-slate-300 hover:text-white">Cerrar</button>
        </div>
        <div className="space-y-3 overflow-auto max-h-[70vh] pr-1">
          {items.length === 0 && <p className="text-slate-400">Tu carrito está vacío.</p>}
          {items.map((it, idx) => (
            <div key={idx} className="flex gap-3 bg-white/5 rounded-lg p-2 border border-white/10">
              <div className="w-16 h-16 bg-slate-800 rounded-md overflow-hidden">
                {it.image_url ? (
                  <img src={it.image_url} alt={it.title} className="w-full h-full object-cover" />
                ) : null}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white font-medium leading-tight">{it.title}</p>
                    {it.size && <p className="text-slate-400 text-xs">Talla: {it.size}</p>}
                  </div>
                  <button className="text-red-400 hover:text-red-300 text-sm" onClick={() => onRemove(it.product_id, it.size)}>Eliminar</button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <button className="px-2 py-1 bg-white/10 rounded" onClick={() => onQty(it.product_id, it.size, Math.max(1, it.quantity - 1))}>-</button>
                    <span className="text-white">{it.quantity}</span>
                    <button className="px-2 py-1 bg-white/10 rounded" onClick={() => onQty(it.product_id, it.size, it.quantity + 1)}>+</button>
                  </div>
                  <span className="text-blue-300 font-semibold">${(it.unit_price * it.quantity).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 border-t border-white/10 pt-3 flex items-center justify-between">
          <span className="text-slate-300">Total</span>
          <span className="text-white font-bold text-lg">${total.toFixed(2)}</span>
        </div>
        <button disabled={items.length===0} className="mt-3 w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg py-2 font-semibold">Finalizar compra</button>
      </div>
    </div>
  )
}

export default function Storefront() {
  const [products, setProducts] = useState([])
  const [cartId, setCartId] = useState(null)
  const [cart, setCart] = useState(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchProducts = async () => {
    const res = await fetch(`${API_BASE}/api/products`)
    if (res.ok) {
      const data = await res.json()
      if (data.length === 0) {
        // Seed demo data
        await fetch(`${API_BASE}/api/products/seed`, { method: 'POST' })
        const res2 = await fetch(`${API_BASE}/api/products`)
        const data2 = await res2.json()
        setProducts(data2)
      } else {
        setProducts(data)
      }
    }
  }

  const refreshCart = async (id) => {
    const res = await fetch(`${API_BASE}/api/cart?cart_id=${id}`)
    if (res.ok) {
      const data = await res.json()
      setCart(data)
    }
  }

  const addToCart = async (product) => {
    const payload = { cart_id: cartId, product_id: product.id, quantity: 1 }
    const res = await fetch(`${API_BASE}/api/cart:add`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (res.ok) {
      const data = await res.json()
      const id = data.cart_id
      setCartId(id)
      await refreshCart(id)
      setOpen(true)
    }
  }

  const removeFromCart = async (product_id, size) => {
    if (!cartId) return
    const payload = { cart_id: cartId, product_id, size }
    const res = await fetch(`${API_BASE}/api/cart:remove`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (res.ok) await refreshCart(cartId)
  }

  const updateQty = async (product_id, size, quantity) => {
    if (!cartId) return
    const payload = { cart_id: cartId, product_id, size, quantity }
    const res = await fetch(`${API_BASE}/api/cart:qty`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (res.ok) await refreshCart(cartId)
  }

  useEffect(() => {
    fetchProducts().finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="sticky top-0 z-40 backdrop-blur bg-slate-900/70 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/flame-icon.svg" className="w-8 h-8" />
            <span className="text-white font-semibold">SportShop</span>
          </div>
          <button onClick={() => setOpen(true)} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white">Carrito {cart?.items?.length ? `(${cart.items.length})` : ''}</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-6">Novedades</h1>

        {loading ? (
          <p className="text-slate-300">Cargando...</p>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {products.map(p => (
              <ProductCard key={p.id} product={p} onAdd={() => addToCart(p)} />
            ))}
          </div>
        )}
      </main>

      <CartDrawer open={open} onClose={() => setOpen(false)} cart={cart} onRemove={removeFromCart} onQty={updateQty} />
    </div>
  )
}
