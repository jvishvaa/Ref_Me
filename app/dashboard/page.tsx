"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Edit, Trash2, ExternalLink, Plus, X, Globe, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/lib/useAuth";
import {
  addDoc,
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import Loader from "../Loader/loader";
import Toast from "../components/toast";

const COLOR_SCHEMES = [
  "bg-blue-100/70 text-blue-800 ring-1 ring-blue-300 backdrop-blur-sm",
  "bg-emerald-100/70 text-emerald-800 ring-1 ring-emerald-300 backdrop-blur-sm",
  "bg-violet-100/70 text-violet-800 ring-1 ring-violet-300 backdrop-blur-sm",
  "bg-rose-100/70 text-rose-800 ring-1 ring-rose-300 backdrop-blur-sm",
  "bg-amber-100/70 text-amber-800 ring-1 ring-amber-300 backdrop-blur-sm",
  "bg-cyan-100/70 text-cyan-800 ring-1 ring-cyan-300 backdrop-blur-sm",
];

export default function Dashboard() {
  const { user } = useAuth();
  const [refData, setRefData] = useState({
    referenceName: "",
    referenceLink: "",
    visibility: "",
    category: "",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [addCategory, setAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [isEdit, setIsEdit] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [references, setReferences] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
    duration = 3000,
  ) => {
    setToast({ show: true, message, type });

    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, duration);
  };

  useEffect(() => {
    let unsub: any;

    setLoading(true);

    // 🔓 NOT LOGGED IN → show ALL PUBLIC data
    if (!user) {
      const publicQuery = collection(db, "publicReferences");

      unsub = onSnapshot(publicQuery, (snap) => {
        const publicRefs = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setReferences(publicRefs);
        setLoading(false);
      });
    }

    // 🔐 LOGGED IN → show ONLY YOUR data (public + private)
    if (user) {
      const userQuery = collection(db, "users", user.uid, "reference");

      unsub = onSnapshot(userQuery, (snap) => {
        const userRefs = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setReferences(userRefs);
        setLoading(false);
      });
    }

    return () => unsub && unsub();
  }, [user]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "categories"), (snap) => {
      setCategories(snap.docs.map((doc) => doc.data().name));
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText.toLowerCase().trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [searchText]);

  const getCategoryColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return COLOR_SCHEMES[Math.abs(hash) % COLOR_SCHEMES.length];
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRefData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdate = (item: any) => {
    setIsEdit(true);
    setEditingId(item.id);

    setRefData({
      referenceName: item.referenceName,
      referenceLink: item.referenceLink,
      visibility: item.visibility,
      category: item.category,
    });

    setIsModalOpen(true);
  };

  const handleDelete = async (referenceId: string) => {
    try {
      if (!user) {
        // alert("User not logged in");
        showToast("User not logged in", "error");
        return;
      }

      await Promise.all([
        deleteDoc(doc(db, "users", user.uid, "reference", referenceId)),
        deleteDoc(doc(db, "publicReferences", referenceId)).catch(() => {}),
      ]);
    } catch (err: any) {
      console.error("Error deleting reference:", err);
      showToast(err.message || "Something went wrong", "error");
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      // alert("User not logged in");
      showToast("User not logged in", "error");
      return;
    }

    const { referenceName, referenceLink, visibility, category } = refData;

    if (!referenceName || !referenceLink || !visibility || !category) {
      // alert("All fields are required");
      showToast("All fields are required", "error");
      return;
    }

    try {
      let refId = editingId;

      // 🔹 1️⃣ CREATE OR UPDATE USER REFERENCE
      if (isEdit && editingId) {
        const userRef = doc(db, "users", user.uid, "reference", editingId);

        await updateDoc(userRef, {
          referenceName,
          referenceLink,
          visibility,
          category,
          updatedAt: serverTimestamp(),
        });
      } else {
        const userRef = await addDoc(
          collection(db, "users", user.uid, "reference"),
          {
            referenceName,
            referenceLink,
            visibility,
            category,
            postedBy: user.username || "Anonymous",
            ownerId: user.uid,
            createdAt: serverTimestamp(),
          },
        );

        refId = userRef.id;
      }

      // 🔹 2️⃣ SYNC WITH PUBLIC REFERENCES
      const publicRef = doc(db, "publicReferences", refId!);

      if (visibility === "public") {
        await setDoc(publicRef, {
          referenceName,
          referenceLink,
          category,
          postedBy: user.username || "Anonymous",
          ownerId: user.uid,
          createdAt: serverTimestamp(),
        });
      } else {
        // 🔒 remove from public if switched to private
        await deleteDoc(publicRef).catch(() => {});
      }

      // 🔹 3️⃣ RESET UI
      setRefData({
        referenceName: "",
        referenceLink: "",
        visibility: "",
        category: "",
      });

      setIsModalOpen(false);
      setIsEdit(false);
      setEditingId(null);

      console.log("✅ Reference saved successfully");
    } catch (err: any) {
      console.error("❌ Submit error:", err);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;

    const normalized = newCategory.trim().toLowerCase();

    await setDoc(doc(db, "categories", normalized), {
      name: normalized,
      createdBy: user?.uid,
      createdAt: serverTimestamp(),
    });

    setNewCategory("");
    setAddCategory(false);
  };

  const filteredReferences = Array.isArray(references)
    ? references.filter((item) => {
        const categoryMatch =
          !selectedCategory || item.category === selectedCategory;

        const userMatch = !selectedUser || item.postedBy === selectedUser;

        const searchMatch =
          !debouncedSearch ||
          item.referenceName?.toLowerCase().includes(debouncedSearch);

        return categoryMatch && userMatch && searchMatch;
      })
    : [];

  return (
    <div className="w-full overflow-x-auto rounded-xl">
      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 backdrop-blur-sm rounded-xl">
          <Loader />
        </div>
      )}
      <div className="mb-3 p-2 rounded-xl flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
        <div className="flex flex-col sm:flex-row flex-wrap gap-4 w-full">
          {/* Search Field */}
          <input
            type="text"
            placeholder="Search by reference name..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="px-4 py-1.5 border border-gray-300 rounded-lg text-sm w-full sm:w-64
             outline-none focus:ring-2 focus:ring-black"
          />

          {/* Category */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1 w-full sm:w-48 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-black"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Posted By */}
          {!user && (
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="px-3 py-1 w-full sm:w-48 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-black"
            >
              <option value="">All Users</option>
              {[...new Set(references.map((r) => r.postedBy))].map(
                (user) =>
                  user && (
                    <option key={user} value={user}>
                      {user}
                    </option>
                  ),
              )}
            </select>
          )}

          <button
            onClick={() => {
              setSelectedCategory("");
              setSelectedUser("");
            }}
            className="px-3 py-1 text-sm border rounded-lg hover:bg-amber-700 bg-amber-600 text-white cursor-pointer"
          >
            Clear Filters
          </button>
        </div>

        {user && (
          <button
            className="flex items-center justify-center gap-2
                 px-5 py-1 text-white bg-red-600 hover:bg-red-700
                 rounded-lg transition-colors cursor-pointer
                 w-full sm:w-68"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={24} />
            Add New Reference
          </button>
        )}
      </div>
      <div className="w-full overflow-x-auto">
        <table className="min-w-[900px] w-full text-sm border border-gray-300 border-collapse rounded-lg">
          {/* 🔥 Header */}
          <thead className="sticky top-0 bg-black z-10">
            <tr>
              <th className="px-4 py-3 text-left text-white font-semibold border border-gray-300">
                S.No
              </th>
              <th className="px-4 py-3 text-left text-white font-semibold border border-gray-300">
                Reference Name
              </th>
              <th className="px-4 py-3 text-left text-white font-semibold border border-gray-300">
                Category
              </th>
              <th className="px-4 py-3 text-left text-white font-semibold border border-gray-300">
                Link
              </th>
              <th className="px-4 py-3 text-left text-white font-semibold border border-gray-300">
                Posted By
              </th>
              <th className="px-4 py-3 text-left text-white font-semibold border border-gray-300">
                Posted On
              </th>
              {user && (
                <th className="px-4 py-3 text-center text-white font-semibold border border-gray-300">
                  Action
                </th>
              )}
            </tr>
          </thead>

          {/* ☀️ Body */}
          <tbody>
            {filteredReferences.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="text-center py-12 text-gray-500 font-medium border border-gray-200"
                >
                  No data available
                </td>
              </tr>
            ) : (
              filteredReferences.map((item, index) => (
                <tr
                  key={item.id}
                  className="odd:bg-white even:bg-gray-50 hover:bg-gray-100 transition"
                >
                  {/* S.No */}
                  <td className="px-4 py-3 text-gray-600 border border-gray-200">
                    {index + 1}
                  </td>

                  {/* Reference Name */}
                  <td className="px-4 py-3 text-gray-900 font-medium border border-gray-200">
                    {item.referenceName}
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3 border border-gray-200">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getCategoryColor(
                        item.category,
                      )}`}
                    >
                      {item.category}
                    </span>
                  </td>

                  {/* Link */}
                  <td className="px-4 py-3 max-w-[220px] border border-gray-200">
                    <a
                      href={item.referenceLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:underline truncate"
                    >
                      <span className="truncate">{item.referenceLink}</span>
                      <ExternalLink size={14} />
                    </a>
                  </td>

                  {/* Posted By */}
                  <td className="px-4 py-3 text-gray-700 border border-gray-200">
                    {item.postedBy}
                  </td>

                  {/* Posted On */}
                  <td className="px-4 py-3 text-gray-500 border border-gray-200">
                    {item?.createdAt?.toDate
                      ? item.createdAt.toDate().toLocaleDateString()
                      : "--"}
                  </td>

                  {/* Actions */}
                  {user && (
                    <td className="px-4 py-3 border border-gray-200">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          className="p-2 rounded-lg hover:bg-green-100 transition"
                          title="Edit"
                          onClick={() => handleUpdate(item)}
                        >
                          <Edit size={16} className="text-green-600" />
                        </button>

                        <button
                          className="p-2 rounded-lg hover:bg-red-100 transition"
                          title="Delete"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 size={16} className="text-red-600" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 backdrop-brightness-50 backdrop-blur-xs z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ duration: 0.35, ease: "easeIn" }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-900">
                  <div>
                    <h2 className="text-2xl font-semibold text-white">
                      Add Reference
                    </h2>
                  </div>
                  <div className="flex">
                    <button
                      className="p-2 hover:bg-gray-100 hover:text-black text-white rounded-lg transition-colors cursor-pointer"
                      onClick={() => setIsModalOpen(false)}
                    >
                      <X size={24} />
                    </button>
                  </div>
                </div>

                {/* Modal fields */}
                <div className="p-6 flex-1 overflow-y-auto">
                  <div className="space-y-6 gap-6">
                    {/* Reference Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reference Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="referenceName"
                        placeholder="Reference Name"
                        value={refData?.referenceName}
                        onChange={handleChange}
                        className="w-full border font-medium text-sm text-gray-700 placeholder-gray-400 px-4 py-1 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-transparent outline-none transition-all"
                      />
                    </div>

                    {/* Reference Link */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reference Link <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="referenceLink"
                        placeholder="Reference Link"
                        value={refData?.referenceLink}
                        onChange={handleChange}
                        className="w-full border font-medium text-sm text-gray-700 placeholder-gray-400 px-4 py-1 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-transparent outline-none transition-all"
                      />
                    </div>

                    {/* Visibility */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Visibility <span className="text-red-500">*</span>
                      </label>

                      <div className="flex gap-4">
                        {/* Public */}
                        <label
                          className={`flex items-center gap-2 px-4 py-1 rounded-lg border cursor-pointer transition
                              ${
                                refData.visibility === "public"
                                  ? "border-green-500 bg-green-50"
                                  : "border-gray-300 hover:bg-gray-50"
                              }`}
                        >
                          <input
                            type="radio"
                            name="visibility"
                            value="public"
                            checked={refData.visibility === "public"}
                            onChange={(e) =>
                              setRefData((prev) => ({
                                ...prev,
                                visibility: e.target.value,
                              }))
                            }
                            className="hidden"
                          />
                          <Globe size={18} className="text-green-600" />
                          <span className="text-sm font-medium text-gray-700">
                            Public
                          </span>
                        </label>

                        {/* Private */}
                        <label
                          className={`flex items-center gap-2 px-4 py-1 rounded-lg border cursor-pointer transition
                            ${
                              refData.visibility === "private"
                                ? "border-red-500 bg-red-50"
                                : "border-gray-300 hover:bg-gray-50"
                            }`}
                        >
                          <input
                            type="radio"
                            name="visibility"
                            value="private"
                            checked={refData.visibility === "private"}
                            onChange={(e) =>
                              setRefData((prev) => ({
                                ...prev,
                                visibility: e.target.value,
                              }))
                            }
                            className="hidden"
                          />
                          <Lock size={18} className="text-red-600" />
                          <span className="text-sm font-medium text-gray-700">
                            Private
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-3 flex-wrap">
                        {categories.map((cat) => {
                          const isSelected = refData.category === cat;

                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() =>
                                setRefData((prev) => ({
                                  ...prev,
                                  category: cat,
                                }))
                              }
                              className={`
                                px-2 rounded-2xl text-xs font-medium transition-all
                                ${getCategoryColor(cat)}
                                ${isSelected ? "ring-2 scale-105" : "hover:opacity-90"}
                              `}
                            >
                              {cat}
                            </button>
                          );
                        })}

                        <button
                          className="rounded-full bg-red-500 hover:bg-red-600 transition-all relative p-1 cursor-pointer"
                          onClick={() => setAddCategory(true)}
                        >
                          <Plus size={20} color="white" />
                        </button>
                      </div>
                      {addCategory && (
                        <div className="mt-3 flex gap-4">
                          <input
                            type="text"
                            name="category"
                            placeholder="New Category"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            className="w-1/2 border font-medium text-sm text-gray-700 px-4 placeholder-gray-400 py-1 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-transparent outline-none transition-all"
                          />
                          <button
                            className="flex gap-2 px-3 py-1 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors cursor-pointer"
                            onClick={handleAddCategory}
                          >
                            Add
                          </button>
                          <button
                            className="px-3 py-1 border bg-black border-gray-200 text-white rounded-lg hover:bg-black transition-colors font-medium cursor-pointer"
                            onClick={() => setAddCategory(false)}
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Drawer footer */}
                <div className="p-4 border-t border-gray-300 bg-gray-50">
                  <div className="flex justify-between">
                    <button
                      className="px-3 py-1 border bg-red-500 border-gray-200 text-white rounded-lg hover:bg-red-700 transition-colors font-medium cursor-pointer"
                      onClick={() => setIsModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      className="px-3 py-1 border bg-black border-gray-200 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium cursor-pointer"
                    >
                      {`${isEdit ? "Update" : "Submit"}`}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
