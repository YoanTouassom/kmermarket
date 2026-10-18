import { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

import Layout from "./components/layout/Layout";
import AccountLayout from "./components/layout/AccountLayout";
import AdminLayout from "./admin/components/AdminLayout";
import { useAuthStore } from "./store/authStore";
import { useCatalogStore } from "./store/catalogStore";
import { useCartStore } from "./store/cartStore";

import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import Profile from "./pages/account/Profile";
import Addresses from "./pages/account/Addresses";
import Preferences from "./pages/account/Preferences";
import NotFound from "./pages/NotFound";

import Dashboard from "./admin/pages/Dashboard";
import AdminProducts from "./admin/pages/Products";
import ProductForm from "./admin/pages/ProductForm";
import Categories from "./admin/pages/Categories";
import AdminOrders from "./admin/pages/Orders";
import AdminOrderDetail from "./admin/pages/OrderDetail";
import Users from "./admin/pages/Users";
import Content from "./admin/pages/Content";
import Settings from "./admin/pages/Settings";
import Toaster from "./components/ui/Toaster";

function useBootstrap() {
  const init = useAuthStore((s) => s.init);
  const initialized = useAuthStore((s) => s.initialized);
  const user = useAuthStore((s) => s.user);
  const loadCatalog = useCatalogStore((s) => s.load);
  const loaded = useCatalogStore((s) => s.loaded);
  const syncFromServer = useCartStore((s) => s.syncFromServer);
  useEffect(() => {
    init();
  }, [init]);
  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);
  useEffect(() => {
    if (initialized && user) syncFromServer().catch(() => {});
  }, [initialized, user, syncFromServer]);
  return initialized && loaded;
}

function FullPageLoader() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "var(--cream)",
      }}
    >
      <div style={{ textAlign: "center", color: "var(--green-600)" }}>
        <Loader2 size={36} className="mf-spin" />
        <p style={{ marginTop: 12, color: "var(--ink-500)", fontSize: 14 }}>
          Chargement de KmerMarket…
        </p>
      </div>
    </div>
  );
}

function RequireAuth({ children, role }) {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  if (!user)
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const ready = useBootstrap();
  if (!ready) return <FullPageLoader />;

  // Toaster global : les pages hors layout (login, register…) doivent
  // aussi pouvoir afficher leurs messages.
  return (
    <>
    <Toaster />
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />

        <Route
          path="/account"
          element={
            <RequireAuth>
              <AccountLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Profile />} />
          <Route path="addresses" element={<Addresses />} />
          <Route path="preferences" element={<Preferences />} />
        </Route>
        <Route
          path="/orders"
          element={
            <RequireAuth>
              <AccountLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Orders />} />
          <Route path=":id" element={<OrderDetail />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route
        path="/admin"
        element={
          <RequireAuth role="admin">
            <AdminLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/:id/edit" element={<ProductForm />} />
        <Route path="categories" element={<Categories />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="orders/:id" element={<AdminOrderDetail />} />
        <Route path="users" element={<Users />} />
        <Route path="content" element={<Content />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
    </>
  );
}
