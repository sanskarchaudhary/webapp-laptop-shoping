"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ShoppingCart,
  Menu,
  Search,
  User as UserIcon,
  Plus,
  Minus,
  X,
  Edit,
  Trash,
  Package,
  DollarSign,
  TrendingUp,
  PlusIcon,
  PencilIcon,
  Laptop,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import _ from "lodash";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  deleteDoc,
  getDoc,
  query,
  where,
  setDoc,
} from "firebase/firestore";
import e from "express";
import {
  GoogleAuthProvider,
  signInWithPopup as firebaseSignInWithPopup,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  createUserWithEmailAndPassword as firebaseCreateUserWithEmailAndPassword,
  getAuth as firebaseGetAuth,
  FacebookAuthProvider,
  User as FirebaseUser,
} from "firebase/auth";
interface User extends FirebaseUser {
  role?: string;
}
import { auth as Auth } from "firebase-admin";
import { log } from "console";
const firebaseConfig = {
  apiKey: "AIzaSyD6VqBgebj0bSsluFTDLarMPA1FMoimNOM",
  authDomain: "laptop-82612.firebaseapp.com",
  projectId: "laptop-82612",
  storageBucket: "laptop-82612.appspot.com",
  messagingSenderId: "452320341006",
  appId: "1:452320341006:web:caeece44b7568ab486a05f",
  measurementId: "G-VP49R9R3FC",
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}
type Order = {
  id: string;
  customerName: string;
  items: CartItem[];
  total: number;
  status: string;
  date: string;
  address: string;
};
type Laptop = {
  firb_id: string;
  id: any;
  name: any;
  description: any;
  price: any;
  brand: any;
  image: any;
  stock: any;
  sold: any;
};
export default function TechreviveWithAdmin() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [currentPage, setCurrentPage] = useState("home");
  const [laptops, setLaptops] = useState<Laptop[]>([]);
  const [editingLaptop, setEditingLaptop] = useState<Laptop | null>(null);
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [quickViewLaptop, setQuickViewLaptop] = useState<Laptop | null>(null);
  const [originalLaptops, setOriginalLaptops] = useState<Laptop[]>(laptops);
  const [error, setError] = useState<string | null>(null);
  const [filteredLaptops, setFilteredLaptops] = useState<Laptop[]>([]);
  const [isEditAddressDialogOpen, setIsEditAddressDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newAddress, setNewAddress] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const updateQuantity = (id: number, change: number) => {
    setCartItems((items) =>
      items
        .map((item) =>
          item.id === id
            ? { ...item, quantity: Math.max(0, item.quantity + change) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };
  const fetchOrders = async () => {
    const auth = firebaseGetAuth();
    const userId = auth.currentUser?.uid; // Get current user's ID

    if (!userId) return; // Exit if no user ID

    const ordersCollection = collection(db, "orders");
    const q = query(
      ordersCollection,
      where("customer_id", "==", userId),
      where("status", "in", ["wc-completed", "wc-processing"]) // Add desired order statuses
    );
    const querySnapshot = await getDocs(q);
    const ordersData = querySnapshot.docs.map((doc) => doc.data() as Order);
    setOrders(ordersData);
  };
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const ordersCollection = collection(db, "orders");
        const querySnapshot = await getDocs(ordersCollection);
        const ordersData = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as Order[];
        setOrders(ordersData);
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
    };

    fetchOrders();
  }, []);
  useEffect(() => {
    const fetchLaptops = async () => {
      try {
        const laptopsCollection = collection(db, "laptops"); // Replace "laptops" with your actual collection name
        const laptopsSnapshot = await getDocs(laptopsCollection);
        const laptopsList: Laptop[] = laptopsSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            firb_id: doc.id,
            id: data.id,
            name: data.name,
            description: data.description,
            price: data.price,
            brand: data.brand,
            image: data.image,
            stock: data.stock,
            sold: data.sold,
          };
        });
        setLaptops(laptopsList);
        setFilteredLaptops(laptopsList);
        setOriginalLaptops(laptopsList);
      } catch (error) {
        console.error("Error fetching laptops:", error);
      }
    };

    fetchLaptops();
  }, []);
  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const addToCart = (laptop: Laptop) => {
    const existingItem = cartItems.find((item) => item.id === laptop.id);
    if (existingItem) {
      updateQuantity(laptop.id, 1);
    } else {
      setCartItems([
        ...cartItems,
        { id: laptop.id, name: laptop.name, price: laptop.price, quantity: 1 },
      ]);
    }
  };
  const getTotalRevenue = () => {
    return laptops.reduce((sum, laptop) => sum + laptop.price * laptop.sold, 0);
  };
  const getTotalSold = () => {
    return laptops.reduce((sum, laptop) => sum + laptop.sold, 0);
  };
  const getTotalStock = () => {
    return laptops.reduce((sum, laptop) => sum + laptop.stock, 0);
  };
  const updateOrderStatus = async (
    orderId: string,
    newStatus: "pending" | "shipped" | "delivered"
  ) => {
    try {
      const orderRef = doc(db, "orders", orderId); // Get the document reference
      await updateDoc(orderRef, { status: newStatus }); // Update the status in Firestore
      setOrders(
        orders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      ); // Update local state
      console.log("Order status updated successfully");
    } catch (error) {
      console.error("Error updating order status: ", error); // Log any errors
    }
  };
  const handleDeleteOrder = async (order: Order) => {
    if (!order) {
      console.error("No order is being deleted.");
      return;
    }
    const orderId = order.id; // Ensure orderId is a string
    try {
      await deleteDoc(doc(db, "orders", orderId)); // Delete the order from Firestore
      // Update the local state by filtering out the deleted order
      setOrders(orders.filter((ord) => ord.id !== order.id));
      console.log("Order document deleted successfully");
    } catch (error) {
      console.error("Error deleting order: ", error); // Log any errors
    }
  };
  const Header = () => {
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    const handleSignUpWithGoogle = async () => {
      const provider = new GoogleAuthProvider();
      try {
        const auth = firebaseGetAuth();
        const result = await firebaseSignInWithPopup(auth, provider);
        const user = result.user;

        // Check if the user already exists in your database
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
          // If the user doesn't exist, create a new user document with the "user" role
          await setDoc(userRef, {
            name: user.displayName ?? "",
            email: user.email ?? "",
            role: "user",
            createdAt: new Date(),
          });
        }

        setError(null);
      } catch (error) {
        console.error("Error signing up:", error);
        setError("Failed to sign up with Google. Please try again.");
      }
    };
    const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!email || !password || !name || !phone) {
        console.error("Name, email, phone, and password are required.");
        return;
      }

      try {
        const auth = firebaseGetAuth();
        const userCredential = await firebaseCreateUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        if (userCredential.user) {
          // Update the user's profile with the name
          await firebaseUpdateProfile(userCredential.user, {
            displayName: name,
          });

          // Add user to Firestore
          const db = getFirestore();
          const userDocRef = doc(db, "users", userCredential.user.uid);
          await firebaseSetDoc(userDocRef, {
            name: name,
            email: email,
            phone: phone,
            createdAt: new Date(),
          });

          console.log(
            "User signed up and added to Firestore successfully:",
            userCredential.user
          );
          setError(null);
          setIsAuthOpen(false); // Close the auth dialog
          // You can add additional logic here, such as updating UI or redirecting the user
        }
      } catch (error) {
        console.error("Error signing up:", error);
        setError("Failed to sign up. Please try again.");
      }
    };

    const handleSignUpWithFacebook = async () => {
      const provider = new FacebookAuthProvider();
      try {
        const auth = firebaseGetAuth();
        await firebaseSignInWithPopup(auth, provider);
        setError(null);
      } catch (error) {
        console.error("Error signing up:", error);
      }
    };

    const handleSignInWithGoogle = async () => {
      const provider = new GoogleAuthProvider();
      try {
        const auth = firebaseGetAuth();
        const result = await firebaseSignInWithPopup(auth, provider);
        // This gives you a Google Access Token. You can use it to access the Google API.
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential?.accessToken;
        // The signed-in user info.
        const user = result.user;
        console.log("User signed in with Google:", user);
        setError(null);
        // Fetch the user document to get the role
        const db = getFirestore();
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnapshot = await getDoc(userDocRef);
        const userData = userDocSnapshot.data();
        const userWithRole = { ...user, role: userData?.role || "user" };
        console.log("userWithRole", userWithRole.role);
        console.log("userWithRole", userWithRole);
        setCurrentUser(userWithRole);
        localStorage.setItem("user", JSON.stringify(userWithRole));
        // You can add additional logic here, such as updating UI or redirecting the user
      } catch (error) {
        console.error("Error signing in with Google:", error);
        setError("Failed to sign in with Google. Please try again.");
      }
    };

    const handleSignInWithFacebook = async () => {
      const provider = new FacebookAuthProvider();
      try {
        const auth = firebaseGetAuth();
        const result = await firebaseSignInWithPopup(auth, provider);
        // This gives you a Facebook Access Token. You can use it to access the Facebook API.
        const credential = FacebookAuthProvider.credentialFromResult(result);
        const token = credential?.accessToken;
        // The signed-in user info.
        const user = result.user;
        console.log("User signed in with Facebook:", user);
        setError(null);
        // You can add additional logic here, such as updating UI or redirecting the user
      } catch (error) {
        console.error("Error signing in with Facebook:", error);
        setError("Failed to sign in with Facebook. Please try again.");
      }
    };

    const handleSignIn = async () => {
      try {
        const auth = firebaseGetAuth();
        const userCredential = await firebaseSignInWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;
        console.log("User signed in:", user);
        setError(null);
        setIsAuthOpen(false);
        // You can add additional logic here, such as updating UI or redirecting the user
      } catch (error) {
        console.error("Error signing in:", error);
        setError("Failed to sign in. Please check your email and password.");
      }
    };

    function setUsername(value: string): void {
      throw new Error("Function not implemented.");
    }

    useEffect(() => {
      const user = localStorage.getItem("user");
      if (user) {
        setCurrentUser(JSON.parse(user));
      }

      // setCurrentUser(user);
    }, []);

    return (
      <header className="sticky top-0 z-50 backdrop-blur-md bg-black/20 border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-white hover:bg-white/10"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-6 w-6" />
            </Button>
            <button
              onClick={() => setCurrentPage("home")}
              className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-blue-500 to-purple-600"
            >
              PERFECT COMPUTING
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="absolute top-full left-0 right-0 bg-black/90 backdrop-blur-md p-4 space-y-2 md:hidden">
              <button
                onClick={() => {
                  setCurrentPage("home");
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 hover:bg-white/10 rounded"
              >
                Home
              </button>
              <button
                onClick={() => {
                  setCurrentPage("laptops");
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 hover:bg-white/10 rounded"
              >
                Laptops
              </button>
              <button
                onClick={() => {
                  setCurrentPage("orders");
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 hover:bg-white/10 rounded"
              >
                Orders
              </button>
              <button
                onClick={() => {
                  setCurrentPage("about");
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 hover:bg-white/10 rounded"
              >
                About
              </button>
              <button
                onClick={() => {
                  setCurrentPage("contact");
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 hover:bg-white/10 rounded"
              >
                Contact
              </button>
              {currentUser?.role === "admin" && (
                <button
                  onClick={() => {
                    setCurrentPage("admin");
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-white/10 rounded"
                >
                  Admin
                </button>
              )}
            </div>
          )}

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-4">
            <button
              onClick={() => setCurrentPage("home")}
              className="hover:text-green-400 transiti
              on-colors"
            >
              Home
            </button>
            <button
              onClick={() => setCurrentPage("laptops")}
              className="hover:text-blue-400 transition-colors"
            >
              Laptops
            </button>
            <button
              onClick={() => setCurrentPage("about")}
              className="hover:text-purple-400 transition-colors"
            >
              About
            </button>
            <button
              onClick={() => setCurrentPage("orders")}
              className="hover:text-pink-400 transition-colors"
            >
              Orders
            </button>
            <button
              onClick={() => setCurrentPage("contact")}
              className="hover:text-pink-400 transition-colors"
            >
              Contact
            </button>
            {currentUser?.role === "admin" && (
              <button
                onClick={() => setCurrentPage("admin")}
                className="hover:text-yellow-400 transition-colors"
              >
                Admin
              </button>
            )}
          </nav>

          {/* Cart and User Icons */}
          <div className="flex items-center space-x-2 md:space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
            >
              <Search className="h-5 w-5 md:h-6 md:w-6" />
            </Button>
            <Dialog open={isCartOpen} onOpenChange={setIsCartOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/10 relative"
                >
                  <ShoppingCart className="h-6 w-6" />
                  <span className="sr-only">Cart</span>
                  {cartItems.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-black/80 backdrop-blur-xl text-white border border-white/20">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-blue-500 to-purple-600">
                    Your Cart
                  </DialogTitle>
                  <DialogDescription className="text-white/70">
                    Review and manage your selected items.
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4 space-y-4">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between bg-white/5 p-2 rounded-lg"
                    >
                      <span className="font-medium">{item.name}</span>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updateQuantity(item.id, -1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span>{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updateQuantity(item.id, 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <span className="w-20 text-right">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            updateQuantity(item.id, -item.quantity)
                          }
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex justify-between items-center">
                  <span className="text-lg font-bold">Total:</span>
                  <span className="text-lg font-bold">
                    ₹{totalPrice.toFixed(2)}
                  </span>
                </div>
                <Button
                  className="w-full mt-4 bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 hover:from-green-500 hover:via-blue-600 hover:to-purple-700 text-white"
                  onClick={() => {
                    setIsCartOpen(false);
                    setCurrentPage("checkout");
                  }}
                >
                  Proceed to Checkout
                </Button>
              </DialogContent>
            </Dialog>
            <Dialog open={isAuthOpen} onOpenChange={setIsAuthOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/10"
                >
                  <UserIcon className="h-6 w-6" />
                  <span className="sr-only">Account</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-black/80 backdrop-blur-xl text-white border border-white/20">
                {!currentUser ? (
                  <Tabs defaultValue="login" className="w-full">
                    <Separator className="my-4 bg-transparent" />
                    <TabsList className="grid w-full grid-cols-2 bg-white/10">
                      <TabsTrigger
                        value="login"
                        className="data-[state=active]:bg-white/20"
                      >
                        Login
                      </TabsTrigger>
                      <TabsTrigger
                        value="signup"
                        className="data-[state=active]:bg-white/20"
                      >
                        Sign Up
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="login">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-blue-500 to-purple-600">
                          Login
                        </DialogTitle>
                        <DialogDescription className="text-white/70">
                          Enter your credentials to access your account.
                        </DialogDescription>
                      </DialogHeader>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          // Handle login logic here
                          setIsAuthOpen(false);
                        }}
                      >
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="login-email" className="text-right">
                              Email
                            </Label>
                            <Input
                              id="login-email"
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="col-span-3 bg-white/10 border-white/20 text-white placeholder-white/50"
                              required
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label
                              htmlFor="login-password"
                              className="text-right"
                            >
                              Password
                            </Label>
                            <Input
                              id="login-password"
                              type="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="col-span-3 bg-white/10 border-white/20 text-white placeholder-white/50"
                              required
                            />
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setIsAuthOpen(false)}
                            className="text-white hover:bg-white/10"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 hover:from-green-500 hover:via-blue-600 hover:to-purple-700 text-white"
                            onClick={handleSignIn}
                          >
                            Login
                          </Button>
                        </div>
                        <Separator className="my-4" />
                        <div className="space-y-2">
                          <Button
                            type="button"
                            onClick={handleSignInWithGoogle}
                            variant="outline"
                            className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20"
                          >
                            <svg
                              className="w-5 h-5 mr-2"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                              />
                              <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                              />
                              <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                              />
                              <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                              />
                            </svg>
                            Login with Google
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleSignInWithFacebook}
                            className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20"
                          >
                            <svg
                              className="w-5 h-5 mr-2"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path d="M13.397 20.997v-8.196h2.765l.411-3.209h-3.176V7.548c0-.926.258-1.56 1.587-1.56h1.684V3.127A22.336 22.336 0 0 0 14.201 3c-2.444 0-4.122 1.492-4.122 4.231v2.355H7.332v3.209h2.753v8.202h3.312z" />
                            </svg>
                            Login with Facebook
                          </Button>
                        </div>
                      </form>
                    </TabsContent>

                    <TabsContent value="signup">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-blue-500 to-purple-600">
                          Sign Up
                        </DialogTitle>
                        <DialogDescription className="text-white/70">
                          Create a new account to start shopping.
                        </DialogDescription>
                      </DialogHeader>
                      {/* User creation */}
                      <form onSubmit={handleSignUp}>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="signup-name" className="text-right">
                              Name
                            </Label>
                            <Input
                              id="signup-name"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              type="text"
                              className="col-span-3 bg-white/10 border-white/20 text-white placeholder-white/50"
                              required
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label
                              htmlFor="signup-email"
                              className="text-right"
                            >
                              Email
                            </Label>
                            <Input
                              id="signup-email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              type="email"
                              className="col-span-3 bg-white/10 border-white/20 text-white placeholder-white/50"
                              required
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label
                              htmlFor="signup-password"
                              className="text-right"
                            >
                              Password
                            </Label>
                            <Input
                              id="signup-password"
                              type="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="col-span-3 bg-white/10 border-white/20 text-white placeholder-white/50"
                              required
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label
                              htmlFor="signup-phone"
                              className="text-right"
                            >
                              Phone
                            </Label>
                            <Input
                              id="signup-phone"
                              type="tel"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              className="col-span-3 bg-white/10 border-white/20 text-white placeholder-white/50"
                              required
                            />
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setIsAuthOpen(false)}
                            className="text-white hover:bg-white/10"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 hover:from-green-500 hover:via-blue-600 hover:to-purple-700 text-white"
                            onClick={handleSignIn}
                          >
                            Sign Up
                          </Button>
                        </div>
                        <Separator className="my-4" />
                        <div className="space-y-2">
                          <Button
                            type="button"
                            onClick={handleSignUpWithGoogle}
                            variant="outline"
                            className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20"
                          >
                            <svg
                              className="w-5 h-5 mr-2"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                              />
                              <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                              />
                              <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                              />
                              <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                              />
                            </svg>
                            Sign up with Google
                          </Button>
                          <Button
                            type="button"
                            onClick={handleSignUpWithFacebook}
                            variant="outline"
                            className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20"
                          >
                            <svg
                              className="w-5 h-5 mr-2"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path d="M13.397 20.997v-8.196h2.765l.411-3.209h-3.176V7.548c0-.926.258-1.56 1.587-1.56h1.684V3.127A22.336 22.336 0 0 0 14.201 3c-2.444 0-4.122 1.492-4.122 4.231v2.355H7.332v3.209h2.753v8.202h3.312z" />
                            </svg>
                            Sign up with Facebook
                          </Button>
                        </div>
                      </form>
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="p-6 bg-white/10 rounded-lg shadow-lg">
                    <div className="flex flex-col items-center mb-6">
                      {currentUser?.photoURL ? (
                        <div className="relative">
                          <img
                            src={currentUser.photoURL}
                            alt={currentUser.displayName || "User"}
                            className="w-24 h-24 rounded-full border-4 border-gradient-to-r from-green-400 via-blue-500 to-purple-600 mb-4"
                          />
                          <Button
                            size="sm"
                            className="absolute bottom-0 right-0 bg-white/20 hover:bg-white/30 rounded-full p-1"
                            onClick={() => {
                              // Implement image update logic here
                              console.log("Update profile picture");
                            }}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="relative">
                          <div className="w-24 h-24 rounded-full bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold mb-4">
                            {currentUser?.displayName
                              ? currentUser.displayName[0].toUpperCase()
                              : "U"}
                          </div>
                          <Button
                            size="sm"
                            className="absolute bottom-0 right-0 bg-white/20 hover:bg-white/30 rounded-full p-1"
                            onClick={() => {
                              // Implement image update logic here
                              console.log("Add profile picture");
                            }}
                          >
                            <PlusIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-blue-500 to-purple-600">
                        Welcome, {currentUser?.displayName || "User"}!
                      </h2>
                    </div>
                    <div className="space-y-4 bg-white/5 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-white/70 font-semibold">
                          Full Name:
                        </span>
                        <span className="text-white">
                          {currentUser?.displayName || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/70 font-semibold">
                          Email Address:
                        </span>
                        <span className="text-white">{currentUser?.email}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/70 font-semibold">
                          Account Type:
                        </span>
                        <span className="text-white capitalize">
                          {currentUser?.role || "User"}
                        </span>
                      </div>
                    </div>
                    <Button
                      className="mt-8 w-full bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 hover:from-green-500 hover:via-blue-600 hover:to-purple-700 text-white py-3 rounded-lg transition duration-300 ease-in-out text-lg font-semibold"
                      onClick={() => {
                        localStorage.removeItem("user");
                        setCurrentUser(null);
                        setIsAuthOpen(true);
                      }}
                    >
                      Sign Out
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>
    );
  };
  const Footer = () => (
    <footer className="bg-black/40 backdrop-blur-md py-8 mt-12 border-t border-white/10">
      <div className="container mx-auto px-4 text-center text-white/70">
        <p>&copy; 2023 Perfect Computing. All rights reserved.</p>
      </div>
    </footer>
  );
  const QuickView = ({
    laptop,
    onClose,
  }: {
    laptop: Laptop;
    onClose: () => void;
  }) => (
    <Dialog open={!!laptop} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[625px] bg-black/80 backdrop-blur-xl text-white border border-white/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-blue-500 to-purple-600">
            {laptop.name}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={laptop.image}
              alt={laptop.name}
              className="w-full h-auto rounded-lg"
            />
          </div>
          <div className="space-y-4">
            <p className="text-white/80">{laptop.description}</p>
            <p className="text-xl font-bold text-green-400">
              ${laptop.price.toFixed(2)}
            </p>
            <p className="text-white/80">Brand: {laptop.brand}</p>
            <p className="text-white/80">In Stock: {laptop.stock}</p>
            <p className="text-white/80">Sold: {laptop.sold}</p>
            <Button
              className="w-full bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 hover:from-green-500 hover:via-blue-600 hover:to-purple-700 text-white"
              onClick={() => addToCart(laptop)}
            >
              Add to Cart
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
  const HomePage = () => {
    const [searchLaptop, setSearchLaptop] = useState("");

    const handleSearchLaptop = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchLaptop(e.target.value);
      const lowercaseQuery = e.target.value.toLowerCase().trim();

      const filterLaptop = originalLaptops.filter((laptop) => {
        const name = laptop.name.toLowerCase();
        const description = laptop.description.toLowerCase();
        return (
          name.includes(lowercaseQuery) || description.includes(lowercaseQuery)
        );
      });
    };

    // Search button handler
    const handleSearchButton = () => {
      if (searchLaptop !== "") {
        const query = searchLaptop.toLowerCase();

        // Filter the original list instead of the already filtered one
        const filteredLaptops = originalLaptops.filter((laptop) => {
          const name = laptop.name.toLowerCase();
          const description = laptop.description.toLowerCase();
          return name.includes(query) || description.includes(query);
        });

        setLaptops(filteredLaptops); // Update the filtered list
      } else {
        setLaptops(originalLaptops); // Reset to original list if input is empty
      }
    };

    // Clear button handler
    const handleClearSearchButton = () => {
      setSearchLaptop(""); // Reset the search query
      setLaptops(originalLaptops); // Reset to original list
    };

    return (
      <>
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-green-500/20 via-blue-500/20 to-purple-500/20 animate-pulse"></div>
          <div className="container mx-auto px-4 text-center relative z-10">
            <h2 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-blue-500 to-purple-600">
              Revive Your Tech Journey
            </h2>
            <p className="text-xl text-white/80 mb-8">
              Discover quality second-hand laptops at unbeatable prices
            </p>
            <div className="flex justify-center">
              <Input
                className="max-w-sm mr-2 bg-white/10 border-white/20 text-white placeholder-white/50"
                placeholder="Search for laptops..."
                value={searchLaptop}
                onChange={handleSearchLaptop}
              />

              <Button
                className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 hover:from-green-500 hover:via-blue-600 hover:to-purple-700 text-white"
                onClick={
                  searchLaptop ? handleSearchButton : handleClearSearchButton
                }
              >
                {searchLaptop ? "Search" : "Clear"}
              </Button>
            </div>
          </div>
        </section>
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h3 className="text-2xl font-semibold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-blue-500 to-purple-600">
              Featured Laptops
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {laptops.map((laptop) => {
                return (
                  <div
                    key={laptop.id}
                    className="bg-black/40 backdrop-blur-md rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/30 group"
                  >
                    <div className="relative overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={laptop.image}
                        alt={laptop.name}
                        width={500}
                        height={300}
                        className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500/50 via-blue-500/50 to-purple-500/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
                          onClick={() => setQuickViewLaptop(laptop)}
                        >
                          Quick View
                        </Button>
                      </div>
                    </div>
                    <div className="p-4">
                      <h4 className="font-semibold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-blue-500 to-purple-600">
                        {laptop.name}
                      </h4>
                      <p className="text-white/70 mb-4">{laptop.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-green-400">
                          ₹{laptop.price ? laptop.price.toFixed(2) : "N/A"}
                        </span>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 hover:from-green-500 hover:via-blue-600 hover:to-purple-700 text-white"
                          onClick={() => addToCart(laptop)}
                        >
                          Add to Cart
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
        {quickViewLaptop && (
          <QuickView
            laptop={quickViewLaptop}
            onClose={() => setQuickViewLaptop(null)}
          />
        )}
      </>
    );
  };
  const LaptopsPage = () => {
    const [searchLaptop, setSearchLaptop] = useState("");
    const [selectedBrand, setSelectedBrand] = useState("all");
    const [filteredLaptops, setFilteredLaptops] = useState<Laptop[]>([]);

    const handleSearchLaptop = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchLaptop(e.target.value);
      const lowercaseQuery = e.target.value.toLowerCase().trim();

      const filterLaptop = originalLaptops.filter((laptop) => {
        const name = laptop.name.toLowerCase();
        const description = laptop.description.toLowerCase();
        return (
          name.includes(lowercaseQuery) || description.includes(lowercaseQuery)
        );
      });
    };

    // Search button handler
    const handleSearchButton = () => {
      if (searchLaptop !== "") {
        const query = searchLaptop.toLowerCase();

        // Filter the original list instead of the already filtered one
        const filteredLaptops = originalLaptops.filter((laptop) => {
          const name = laptop.name.toLowerCase();
          const description = laptop.description.toLowerCase();
          return name.includes(query) || description.includes(query);
        });

        setLaptops(filteredLaptops); // Update the filtered list
      } else {
        setLaptops(originalLaptops); // Reset to original list if input is empty
      }
    };

    // Clear button handler
    const handleClearButton = () => {
      setSearchLaptop(""); // Reset the search query
      setLaptops(originalLaptops); // Reset to original list
    };

    useEffect(() => {
      let filtered = originalLaptops;
      if (selectedBrand !== "all") {
        filtered = filtered.filter((laptop) => {
          // Debugging: Log filtering process
          if (selectedBrand.toLowerCase() === laptop.brand.toLowerCase()) {
            console.log(laptop.brand);
            return laptops;
          }
          return false;
        });
      }
      setFilteredLaptops(filtered);
    }, [selectedBrand, originalLaptops]);

    const handleBrandChange = (value: string) => {
      setSelectedBrand(value);
    };

    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-blue-500 to-purple-600">
          Our Laptops
        </h1>
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div className="flex mb-4 md:mb-0">
            <Input
              className="max-w-sm mr-2 bg-white/10 border-white/20 text-white placeholder-white/50"
              placeholder="Search laptops..."
              value={searchLaptop}
              onChange={handleSearchLaptop}
            />
            <Button
              className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 hover:from-green-500 hover:via-blue-600 hover:to-purple-700 text-white"
              onClick={searchLaptop ? handleSearchButton : handleClearButton}
            >
              {searchLaptop ? "Search" : "Clear"}
            </Button>
          </div>
          <div className="flex space-x-2">
            <Select value={selectedBrand} onValueChange={handleBrandChange}>
              <SelectTrigger className="w-[180px] bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                <SelectItem value="dell">Dell</SelectItem>
                <SelectItem value="hp">HP</SelectItem>
                <SelectItem value="lenovo">Lenovo</SelectItem>
                <SelectItem value="Apple">Apple</SelectItem>
              </SelectContent>
            </Select>
            <button onClick={handleClearButton}>Clear</button>
            <Select>
              <SelectTrigger className="w-[180px] bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Price Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="0-500">$0 - $500</SelectItem>
                <SelectItem value="500-1000">$500 - $1000</SelectItem>
                <SelectItem value="1000+">$1000+</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {laptops.map((laptop) => (
            <div
              key={laptop.id}
              className="bg-black/40 backdrop-blur-md rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/30 group"
            >
              <div className="relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={laptop.image}
                  alt={laptop.name}
                  width={500}
                  height={300}
                  className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/50 via-blue-500/50 to-purple-500/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
                    onClick={() => setQuickViewLaptop(laptop)}
                  >
                    Quick View
                  </Button>
                </div>
              </div>
              <div className="p-4">
                <h4 className="font-semibold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-blue-500 to-purple-600">
                  {laptop.name}
                </h4>
                <p className="text-white/70 mb-4">{laptop.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-green-400">
                    ₹{laptop.price ? laptop.price.toFixed(2) : "N/A"}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 hover:from-green-500 hover:via-blue-600 hover:to-purple-700 text-white"
                    onClick={() => addToCart(laptop)}
                  >
                    Add to Cart
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {quickViewLaptop && (
          <QuickView
            laptop={quickViewLaptop}
            onClose={() => setQuickViewLaptop(null)}
          />
        )}
      </div>
    );
  };
  const AboutPage = () => (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-blue-500 to-purple-600">
        About PERFECT COMPUTING
      </h1>
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div>
          <p className="text-white/80 mb-4">
            PERFECT COMPUTING is on a mission to make quality technology
            accessible to everyone while promoting sustainability in the tech
            industry. We believe that great technology doesn&apos;t always have
            to be brand new or come with a hefty price tag.
          </p>
          <p className="text-white/80 mb-4">
            Our team of expert technicians carefully inspect, refurbish, and
            certify each laptop we sell, ensuring that you receive a
            high-quality device that meets our rigorous standards. By choosing a
            refurbished laptop, you&apos;re not only saving money but also
            contributing to the reduction of electronic waste.
          </p>
          <p className="text-white/80 mb-4">
            At TechRevive, we&apos;re committed to providing exceptional
            customer service, competitive prices, and a wide selection of
            laptops to suit every need and budget. Join us in our journey to
            revive technology and make a positive impact on both your wallet and
            the environment.
          </p>
          <Button className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 hover:from-green-500 hover:via-blue-600 hover:to-purple-700 text-white">
            Learn More About Our Process
          </Button>
        </div>
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-blue-500/20 to-purple-500/20 rounded-lg"></div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://thumbs.dreamstime.com/z/d-modern-banner-online-shopping-website-customers-engage-digital-store-select-goods-market-buyers-push-buy-316746507.jpg"
            alt="TechRevive Team"
            className="rounded-lg w-full h-auto relative z-10"
          />
        </div>
      </div>
    </div>
  );
  const ContactPage = () => (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-blue-500 to-purple-600">
        Contact Us
      </h1>
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <p className="text-white/80 mb-4">
            We&apos;re here to help! If you have any questions, concerns, or
            just want to chat about tech, don&apos;t hesitate to reach out to
            us. Our friendly team is always ready to assist you.
          </p>
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-blue-500 to-purple-600">
                Our Location
              </h2>
              <p className="text-white/80">
                SCO 42,1st Floor,Sector 20-C, Chandigarh
              </p>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-blue-500 to-purple-600">
                Phone
              </h2>
              <p className="text-white/80">+91 0172-4416073</p>
              <p className="text-white/80">+91 93562-99921</p>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-blue-500 to-purple-600">
                Email
              </h2>
              <p className="text-white/80">perfectcomputing@hotmail.com</p>
            </div>
          </div>
        </div>
        <div>
          <form className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 hover:from-green-500 hover:via-blue-600 hover:to-purple-700 text-white"
            >
              Send Message
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
  const CheckoutPage = () => {
    const [paymentMethod, setPaymentMethod] = useState("credit-card");
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [customerName, setCustomerName] = useState("");
    const [address, setAddress] = useState("");

    const handleSubmit: React.MouseEventHandler<HTMLButtonElement> = async (
      e
    ) => {
      e.preventDefault();
      const total = cartItems.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
      );

      const ordersCollection = collection(db, "orders");
      const ordersSnapshot = await getDocs(ordersCollection);

      // Debugging: Log the fetched order data
      console.log(
        "Fetched Orders Data:",
        ordersSnapshot.docs.map((doc) => doc.data())
      );

      const existingOrders = ordersSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: Number(data.id) || 0, // Convert to number, default to 0 if NaN
        };
      });

      // Debugging: Log existing orders
      console.log("Existing Orders:", existingOrders);

      const maxId =
        existingOrders.length > 0
          ? Math.max(...existingOrders.map((order) => order.id))
          : 0;

      // Debugging: Log the maximum ID
      console.log("Max ID:", maxId);

      const newOrder: Order = {
        id: (maxId + 1).toString(), // Convert number to string
        customerName: customerName,
        address: address,
        items: cartItems,
        total: total,
        status: "pending",
        date: new Date().toString(),
      };

      try {
        // Use setDoc to specify the document ID
        const orderRef = doc(ordersCollection, newOrder.id.toString()); // Ensure the ID is a string
        await setDoc(orderRef, newOrder);
        console.log("Order placed successfully");

        // Update revenue, sold count, and stock
        const updatedLaptops = await Promise.all(
          cartItems.map(async (item) => {
            const laptopRef = doc(db, "laptops", item.id.toString());
            const laptopSnap = await getDoc(laptopRef);
            if (laptopSnap.exists()) {
              const laptopData = laptopSnap.data() as Laptop;
              const updatedStock = laptopData.stock - item.quantity;
              const updatedSold = laptopData.sold + item.quantity;

              // Update the laptop document in Firestore
              await updateDoc(laptopRef, {
                stock: updatedStock,
                sold: updatedSold,
              });

              return { ...laptopData, stock: updatedStock, sold: updatedSold };
            }
            return null;
          })
        );

        // Update local state for laptops
        setLaptops(updatedLaptops.filter(Boolean) as Laptop[]);
      } catch (error) {
        console.error("Error adding order: ", error);
      }

      setCustomerName("");
      setAddress("");
    };

    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-blue-500 to-purple-600">
          Checkout
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Shipping Information
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first-name">First Name</Label>
                    <Input
                      id="first-name"
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="last-name">Last Name</Label>
                    <Input
                      id="last-name"
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="zip">ZIP Code</Label>
                    <Input
                      id="zip"
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
              <RadioGroup
                value={paymentMethod}
                onValueChange={setPaymentMethod}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="credit-card" id="credit-card" />
                  <Label htmlFor="credit-card">Credit Card</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="paypal" id="paypal" />
                  <Label htmlFor="paypal">PayPal</Label>
                </div>
              </RadioGroup>
              {paymentMethod === "credit-card" && (
                <div className="mt-4 space-y-4">
                  <div>
                    <Label htmlFor="card-number">Card Number</Label>
                    <Input
                      id="card-number"
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiry-date">Expiry Date</Label>
                      <Input
                        id="expiry-date"
                        placeholder="MM/YY"
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            <div className="bg-white/5 rounded-lg p-4 space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center"
                >
                  <span>
                    {item.name} x {item.quantity}
                  </span>
                  <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between items-center font-bold">
                <span>Total</span>
                <span>₹{totalPrice.toFixed(2)}</span>
              </div>
            </div>
            <Button
              onClick={handleSubmit} // Now correctly typed
              className="w-full mt-6 bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 hover:from-green-500 hover:via-blue-600 hover:to-purple-700 text-white"
            >
              Place Order
            </Button>
          </div>
        </div>
      </div>
    );
  };
  const AdminPage = () => {
    const handleAddLaptop = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const formData = new FormData(form);

      const newLaptop: Laptop = {
        id: laptops.length + 1,
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        price: parseFloat(formData.get("price") as string),
        brand: formData.get("brand") as string,
        image: formData.get("image") as string,
        stock: parseInt(formData.get("stock") as string),
        sold: 0,
        firb_id: "",
      };

      try {
        const docRef = await addDoc(collection(db, "laptops"), newLaptop);
        console.log("Document written with ID: ", docRef.id);
        setLaptops([...laptops, newLaptop]);
        setIsAdminDialogOpen(false);
      } catch (error) {
        console.error("Error adding document: ", error);
      }
    };

    const handleEditLaptop = (laptop: Laptop) => {
      console.log(laptop);
      setEditingLaptop(laptop);
      setIsAdminDialogOpen(true);
    };

    const handleUpdateLaptop = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const updatedLaptop: Partial<Laptop> = {
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        price: parseFloat(formData.get("price") as string),
        brand: formData.get("brand") as string,
        image: formData.get("image") as string,
        stock: parseInt(formData.get("stock") as string),
      };
      try {
        if (!editingLaptop) {
          console.error("No laptop is being edited.");
          return;
        }

        console.log(editingLaptop);
        const laptopId = editingLaptop.firb_id;

        console.log(`Updating laptop with ID: ${laptopId}`);
        const docRef = doc(db, "laptops", laptopId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          console.log(docSnap);

          console.error("No such document!");
          return;
        }
        console.log("Document exists:", docSnap.data());
        await updateDoc(docRef, updatedLaptop);
        console.log("Document updated successfully");
        // Update the local state
        setLaptops(
          laptops.map((laptop) =>
            laptop.id === editingLaptop.id
              ? { ...laptop, ...updatedLaptop }
              : laptop
          )
        );
        setIsAdminDialogOpen(false);
        setEditingLaptop(null);
      } catch (error) {
        console.error("Error updating document: ", error);
      }
    };

    const handleDeleteLaptop = async (laptop: Laptop) => {
      console.log(laptop);

      try {
        if (!laptop) {
          console.error("No laptop is being deleted.");
          return;
        }
        const laptopId = laptop.firb_id;
        await deleteDoc(doc(db, "laptops", laptopId));

        // Update the local state by filtering out the deleted laptop
        setLaptops(laptops.filter((laptp) => laptp.id !== laptop.id));

        console.log("Document deleted successfully");
      } catch (error) {
        console.error("Error deleting document: ", error);
      }
    };

    const handleDeleteOrder = async (order: Order) => {
      if (!order) {
        console.error("No order is being deleted.");
        return;
      }
      const orderId = order.id; // Ensure orderId is a string
      try {
        await deleteDoc(doc(db, "orders", orderId));
        // Update the local state by filtering out the deleted order
        setOrders(orders.filter((ord) => ord.id !== order.id));
        console.log("Order document deleted successfully");
      } catch (error) {
        console.error("Error deleting order: ", error); // Log any errors
      }
    };

    const [selectedTab, setSelectedTab] = useState("laptops");

    const handleTabSwitch = (tabValue: string) => {
      // Function to update selectedTab on switch");
      setSelectedTab(tabValue);
    };

    useEffect(() => {
      const fetchUserOrders = async () => {
        try {
          const ordersCollection = collection(db, "orders");
          const q = query(ordersCollection);
          const querySnapshot = await getDocs(q);
          const orders = querySnapshot.docs.map((doc) => doc.data() as Order);
        } catch (error) {}
      };

      fetchUserOrders();
    });

    const totalRevenue = getTotalRevenue();
    const totalSold = getTotalSold();
    const totalStock = getTotalStock();
    const safeTotalRevenue = isNaN(totalRevenue)
      ? "N/A"
      : totalRevenue.toString();
    const safeTotalSold = isNaN(totalSold) ? "N/A" : totalSold.toString();
    const safeTotalStock = isNaN(totalStock) ? "N/A" : totalStock.toString();

    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-blue-500 to-purple-600">
          Admin Panel
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{safeTotalRevenue} </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Laptops Sold
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{safeTotalSold}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{safeTotalStock}</div>
            </CardContent>
          </Card>
        </div>
        <Tabs defaultValue={selectedTab} className="space-y-4">
          <TabsList>
            <TabsTrigger
              value="laptops"
              onClick={() => handleTabSwitch("laptops")}
            >
              Laptops
            </TabsTrigger>
            <TabsTrigger
              value="orders"
              onClick={() => handleTabSwitch("orders")}
            >
              Orders
            </TabsTrigger>
          </TabsList>
          {selectedTab === "laptops" && (
            <TabsContent value="laptops" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Manage Laptops</h2>
                <Button
                  onClick={() => setIsAdminDialogOpen(true)}
                  className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 hover:from-green-500 hover:via-blue-600 hover:to-purple-700 text-white"
                >
                  Add New Laptop
                </Button>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">ID</TableHead>
                      <TableHead className="min-w-[200px]">Product</TableHead>
                      <TableHead className="min-w-[150px]">
                        Description
                      </TableHead>
                      <TableHead className="min-w-[200px]">Price</TableHead>
                      <TableHead className="min-w-[100px]">Brand</TableHead>
                      <TableHead className="min-w-[100px]">Stock</TableHead>
                      <TableHead className="min-w-[150px]">Sold</TableHead>
                      <TableHead className="min-w-[200px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {laptops
                      .sort((a, b) => a.id - b.id)
                      .map((laptop) => (
                        <TableRow key={laptop.id}>
                          <TableCell>{laptop.id}</TableCell>
                          <TableCell>{laptop.name}</TableCell>
                          <TableCell>{laptop.description}</TableCell>
                          <TableCell>
                            {" "}
                            {laptop.price ? laptop.price.toFixed(2) : "N/A"}
                          </TableCell>
                          <TableCell>{laptop.brand}</TableCell>
                          <TableCell>{laptop.stock}</TableCell>
                          <TableCell>{laptop.sold}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditLaptop(laptop)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteLaptop(laptop)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          )}
          {selectedTab === "orders" && (
            <TabsContent value="orders" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Manage Orders</h2>
                <Button
                  onClick={() => {
                    const data = orders.map((orders) => ({
                      OrderID: orders.id,
                      Product: orders.items.map((item) => item.name).join(", "),
                      Customer: orders.customerName,
                      Address: orders.address,
                      Total: orders.total,
                      Status: orders.status,
                      Date: orders.date,
                    }));
                    const csvContent =
                      "sep=,\r\n" +
                      Object.keys(data[0]).join(",") +
                      "\r\n" +
                      data
                        .map((row) => Object.values(row).join(","))
                        .join("\r\n");
                    const blob = new Blob([csvContent], {
                      type: "application/vnd.ms-excel;charset=utf-8;",
                    });
                    const link = document.createElement("a");
                    const url = URL.createObjectURL(blob);
                    link.setAttribute("href", url);
                    link.setAttribute("download", "orders.xls");
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                >
                  Download Orders Data
                </Button>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">ID</TableHead>
                      <TableHead className="min-w-[200px]">Product</TableHead>
                      <TableHead className="min-w-[150px]">Customer</TableHead>
                      <TableHead className="min-w-[200px]">Address</TableHead>
                      <TableHead className="min-w-[100px]">Total</TableHead>
                      <TableHead className="min-w-[100px]">Status</TableHead>
                      <TableHead className="min-w-[150px]">Date</TableHead>
                      <TableHead className="min-w-[200px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders && orders.length > 0 ? (
                      orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>{order.id}</TableCell>
                          <TableCell>
                            {order.items?.map((item) => item.name).join(", ") ||
                              "No items"}
                          </TableCell>
                          <TableCell>{order.customerName || "N/A"}</TableCell>
                          <TableCell>{order.address || "N/A"}</TableCell>
                          <TableCell>
                            ₹{order.total?.toFixed(2) || "0.00"}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`capitalize ${
                                order.status === "delivered"
                                  ? "text-green-500"
                                  : order.status === "shipped"
                                  ? "text-blue-500"
                                  : "text-yellow-500"
                              }`}
                            >
                              {order.status || "pending"}
                            </span>
                          </TableCell>
                          <TableCell>
                            {new Date(order.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Select
                              onValueChange={(value) =>
                                updateOrderStatus(
                                  order.id.toString(),
                                  value as "pending" | "shipped" | "delivered"
                                )
                              }
                            >
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Update Status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="shipped">Shipped</SelectItem>
                                <SelectItem value="delivered">
                                  Delivered
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteOrder(order)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center">
                          No orders found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          )}
        </Tabs>

        <Dialog open={isAdminDialogOpen} onOpenChange={setIsAdminDialogOpen}>
          <DialogContent className="sm:max-w-[425px] bg-black/80 backdrop-blur-xl text-white border border-white/20">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-blue-500 to-purple-600">
                {editingLaptop ? "Edit Laptop" : "Add New Laptop"}
              </DialogTitle>
            </DialogHeader>
            <form
              onSubmit={editingLaptop ? handleUpdateLaptop : handleAddLaptop}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingLaptop?.name}
                  className="bg-white/10 border-white/20 text-white"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editingLaptop?.description}
                  className="bg-white/10 border-white/20 text-white"
                  required
                />
              </div>
              <div>
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  defaultValue={editingLaptop?.price}
                  className="bg-white/10 border-white/20 text-white"
                  required
                />
              </div>
              <div>
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  name="brand"
                  defaultValue={editingLaptop?.brand}
                  className="bg-white/10 border-white/20 text-white"
                  required
                />
              </div>
              <div>
                <Label htmlFor="stock">Stock</Label>
                <Input
                  id="stock"
                  name="stock"
                  type="number"
                  defaultValue={editingLaptop?.stock}
                  className="bg-white/10 border-white/20 text-white"
                  required
                />
              </div>
              <div>
                <Label htmlFor="image">Image</Label>
                <Input
                  id="image"
                  name="image"
                  type="string"
                  defaultValue={editingLaptop?.image}
                  className="bg-white/10 border-white/20 text-white"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 hover:from-green-500 hover:via-blue-600 hover:to-purple-700 text-white"
              >
                {editingLaptop ? "Update Laptop" : "Add Laptop"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  };
  const OrdersPage = () => {
    const [customerName, setCustomerName] = useState(""); // Add this line
    const [userOrders, setUserOrders] = useState<Order[]>([]);

    useEffect(() => {
      // Get customer name from localStorage or context
      const user = localStorage.getItem("user");
      if (user) {
        const userData = JSON.parse(user);
        setCustomerName(userData.displayName || "");
      }
    }, [customerName]);

    // Fetch user's orders when component mounts

    useEffect(() => {
      const fetchUserOrders = async () => {
        try {
          const ordersCollection = collection(db, "orders");
          const q = query(ordersCollection);
          const querySnapshot = await getDocs(q);
          const ordersData = querySnapshot.docs.map(
            (doc) =>
              ({
                ...doc.data(),
                id: doc.id, // Make sure to include the document ID
              } as Order)
          );
          setUserOrders(ordersData);
        } catch (error) {
          console.error("Error fetching orders:", error);
        }
      };

      fetchUserOrders();
    }, []); // Remove customerName from dependency array since it's not needed

    // Handle address update
    const handleUpdateAddress = async () => {
      if (!selectedOrder || !newAddress) return;

      try {
        const orderRef = doc(db, "orders", selectedOrder.id);
        await updateDoc(orderRef, {
          address: newAddress,
        });

        // Update local state
        setUserOrders((prevOrders) =>
          prevOrders.filter((o) => o.id !== selectedOrder.id)
        );

        setIsEditAddressDialogOpen(false);
        setNewAddress("");
        setSelectedOrder(null);
      } catch (error) {
        console.error("Error updating address:", error);
      }
    };

    // Handle order cancellation
    const handleCancelOrder = async (order: Order) => {
      if (order.status !== "pending") {
        alert("Only pending orders can be cancelled");
        return;
      }

      try {
        const orderRef = doc(db, "orders", order.id);
        await deleteDoc(orderRef);
        setUserOrders((prevOrders) =>
          prevOrders.filter((o) => o.id !== order.id)
        );
      } catch (error) {
        console.error("Error cancelling order:", error);
      }
    };

    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-blue-500 to-purple-600">
          My Orders
        </h1>

        <div className="space-y-6">
          {userOrders.length === 0 ? (
            <p className="text-center text-gray-400">No orders found</p>
          ) : (
            userOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white/5 rounded-lg p-6 space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold">Order #{order.id}</h2>
                    <p className="text-sm text-gray-400">{order.date}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      order.status === "delivered"
                        ? "bg-green-500/20 text-green-400"
                        : order.status === "shipped"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-yellow-500/20 text-yellow-400"
                    }`}
                  >
                    {order.status.charAt(0).toUpperCase() +
                      order.status.slice(1)}
                  </span>
                </div>

                <div className="space-y-2">
                  <p>
                    <span className="text-gray-400">Delivery Address:</span>{" "}
                    {order.address}
                  </p>
                  <p>
                    <span className="text-gray-400">Total Amount:</span> ₹
                    {order.total.toFixed(2)}
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Items:</h3>
                  {order.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center"
                    >
                      <span>
                        {item.name} x {item.quantity}
                      </span>
                      <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedOrder(order);
                      setNewAddress(order.address);
                      setIsEditAddressDialogOpen(true);
                    }}
                    disabled={order.status !== "pending"}
                  >
                    Update Address
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleCancelOrder(order)}
                    disabled={order.status !== "pending"}
                  >
                    Cancel Order
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <Dialog
          open={isEditAddressDialogOpen}
          onOpenChange={setIsEditAddressDialogOpen}
        >
          <DialogContent className="sm:max-w-[425px] bg-black/80 backdrop-blur-xl text-white border border-white/20">
            <DialogHeader>
              <DialogTitle>Update Delivery Address</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>New Address</Label>
                <Textarea
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="Enter new delivery address"
                />
              </div>
            </div>
            <div className="flex justify-end gap-4">
              <Button
                variant="ghost"
                onClick={() => setIsEditAddressDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateAddress}>Update Address</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  };
  const [userRole, setUserRole] = useState<string>("user");
  return (
    <div className="bg-[#0a0a0f] text-white min-h-screen relative overflow-hidden">
      <Header />
      <main>
        {currentPage === "home" && <HomePage />}
        {currentPage === "laptops" && <LaptopsPage />}
        {currentPage === "about" && <AboutPage />}
        {currentPage === "contact" && <ContactPage />}
        {currentPage === "checkout" && <CheckoutPage />}
        {currentPage === "orders" && <OrdersPage />}
        {currentPage === "admin" && <AdminPage />}
      </main>
      <Footer />
    </div>
  );
}
function async(id: any) {
  throw new Error("Function not implemented.");
}
function createUserWithEmailAndPassword(
  auth: any,
  email: string,
  password: string
) {
  throw new Error("Function not implemented.");
}
function signInWithEmailAndPassword(auth: any, email: any, password: any) {
  throw new Error("Function not implemented.");
}
function signInWithPopup(auth: any, provider: any) {
  throw new Error("Function not implemented.");
}
function setError(arg0: null) {
  throw new Error("Function not implemented.");
}
function getAuth() {
  throw new Error("Function not implemented.");
}
function updateProfile(user: any, arg1: { displayName: any }) {
  throw new Error("Function not implemented.");
}
function firebaseUpdateProfile(user: User, arg1: { displayName: string }) {
  throw new Error("Function not implemented.");
}
function firebaseSetDoc(
  arg0: any,
  arg1: { name: string; email: string; phone: string; createdAt: any }
) {
  throw new Error("Function not implemented.");
}
function firebaseDoc(db: any, arg1: string, uid: string): any {
  throw new Error("Function not implemented.");
}
function firebaseServerTimestamp() {
  throw new Error("Function not implemented.");
}
function setAddress(arg0: string) {
  throw new Error("Function not implemented.");
}
function setSelectedBrand(value: string) {
  throw new Error("Function not implemented.");
}
export const StaticComponent = () => {
  // component code
};