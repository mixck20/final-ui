import { useEffect, useState } from "react";
import {
  FaHeart, FaRegHeart, FaComment, FaShare, FaPlus, FaTimes, FaSave, FaRegMoon, FaRegSun
} from "react-icons/fa";

function getRelativeTime(dateString) {
  if (!dateString) return "";
  const now = new Date();
  const then = new Date(dateString);
  const diff = (now - then) / 1000;

  if (diff < 60) return "Just now";
  if (diff < 3600) return Math.floor(diff / 60) + "m";
  if (diff < 86400) return Math.floor(diff / 3600) + "h";
  if (diff < 2592000) return Math.floor(diff / 86400) + "d";

  if (now.getFullYear() !== then.getFullYear()) {
    return then.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }
  return then.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const bodyFont = "Arial, 'Inter', 'Segoe UI', 'Helvetica Neue', sans-serif";

export default function Feed() {
  const [darkMode, setDarkMode] = useState(true);

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [likes, setLikes] = useState({});
  const [showComments, setShowComments] = useState({});
  const [comments, setComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [popMessages, setPopMessages] = useState({});
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);

  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    imageUrl: "",
    author: "Anonymous"
  });

  const [editPostId, setEditPostId] = useState(null);
  const [editPostFields, setEditPostFields] = useState({ title: "", content: "", imageUrl: "" });

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmUpdateId, setConfirmUpdateId] = useState(null);

  const [menuOpenId, setMenuOpenId] = useState(null);

  const popText = {
    liked: "❤️ Liked!",
    commented: "💬 Commented!",
    shared: "🔗 Shared!",
    posted: "📝 Posted!",
    deleted: "🗑️ Deleted!",
    edited: "✏️ Edited!",
    updated: "✅ Updated successfully!"
  };

  const popBgColor = {
    liked: "#e0245e",
    commented: "#1da1f2",
    shared: "#17bf63",
    posted: "#794bc4",
    deleted: "#ff595e",
    edited: "#ffa502",
    updated: "#1abc9c"
  };

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("animedia-dark");
    } else {
      document.body.classList.remove("animedia-dark");
    }
  }, [darkMode]);

  useEffect(() => {
    fetchPosts();
    const closeMenu = (e) => setMenuOpenId(null);
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  const fetchPosts = () => {
    setLoading(true);
    fetch("https://final-api-qnqq.onrender.com/api/posts")
      .then((res) => res.json())
      .then((data) => {
        setPosts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching posts:", err);
        setLoading(false);
      });
  };

  const handleLike = (id) => {
    setLikes((prev) => ({ ...prev, [id]: !prev[id] }));
    showPop(id, "liked");
  };

  const handleShare = (id) => {
    showPop(id, "shared");
  };

  const toggleComments = async (postId) => {
    const isOpen = showComments[postId];
    setShowComments((prev) => ({ ...prev, [postId]: !isOpen }));

    if (!isOpen) {
      try {
        const res = await fetch(`https://final-api-qnqq.onrender.com/api/posts/${postId}/comments`);
        if (!res.ok) throw new Error("Failed to load comments");
        const data = await res.json();
        setComments((prev) => ({ ...prev, [postId]: data }));
      } catch (error) {
        console.error("Error fetching comments:", error.message);
        setComments((prev) => ({ ...prev, [postId]: [] }));
      }
    }
  };

  const handleCommentChange = (id, text) => {
    setCommentInputs((prev) => ({ ...prev, [id]: text }));
  };

  const addComment = async (postId) => {
    const content = commentInputs[postId];
    if (!content || content.trim() === "") return;

    try {
      const response = await fetch(`https://final-api-qnqq.onrender.com/api/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          author: "Anonymous",
          content: content,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        let errorText;
        try {
          const errJson = await response.json();
          errorText = errJson.message || JSON.stringify(errJson);
        } catch {
          errorText = await response.text();
        }
        throw new Error(errorText || "Failed to add comment");
      }

      const savedComment = await response.json();

      setComments((prev) => {
        const postComments = prev[postId] || [];
        return { ...prev, [postId]: [...postComments, savedComment] };
      });

      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
      showPop(postId, "commented");
    } catch (error) {
      console.error("Error adding comment:", error.message);
      alert("Error adding comment: " + error.message);
    }
  };

  const handlePostChange = (e) => {
    const { name, value } = e.target;
    setNewPost(prev => ({ ...prev, [name]: value }));
  };

  const submitPost = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("https://final-api-qnqq.onrender.com/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newPost,
          timestamp: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        let errorText;
        try {
          const errJson = await response.json();
          errorText = errJson.message || JSON.stringify(errJson);
        } catch {
          errorText = await response.text();
        }
        throw new Error(errorText || "Failed to create post");
      }

      const createdPost = await response.json();
      setPosts(prev => [createdPost, ...prev]);
      setNewPost({
        title: "",
        content: "",
        imageUrl: "",
        author: "Anonymous"
      });
      setShowCreatePost(false);
      showPop(createdPost.id, "posted");
    } catch (error) {
      console.error("Error creating post:", error.message);
      alert("Error creating post: " + error.message);
    }
  };

  const startEditPost = (id, post) => {
    setEditPostId(id);
    setEditPostFields({ title: post.title, content: post.content, imageUrl: post.imageUrl || "" });
    setMenuOpenId(null);
  };

  const handleEditPostChange = (e) => {
    const { name, value } = e.target;
    setEditPostFields(prev => ({ ...prev, [name]: value }));
  };

  const confirmUpdate = (id) => {
    setConfirmUpdateId(id);
  };
  const cancelUpdateConfirm = () => {
    setConfirmUpdateId(null);
  };


const saveEditPost = async (id) => {
  setConfirmUpdateId(null);
  try {
    const response = await fetch(`https://final-api-qnqq.onrender.com/api/posts/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...editPostFields,
        timestamp: new Date().toISOString()
      }),
    });

    let updatedPost = null;
    let errorText = '';
    if (response.ok) {
      try {
        updatedPost = await response.json();
      } catch {
        updatedPost = null;
      }
    } else {
      try {
        const errJson = await response.json();
        errorText = errJson.message || JSON.stringify(errJson);
      } catch {
        errorText = await response.text();
      }
      throw new Error(errorText || "Failed to edit post");
    }

    setPosts(prev =>
      prev.map(post => post.id === id ? { ...post, ...updatedPost } : post)
    );
    setEditPostId(null);
    setEditPostFields({ title: "", content: "", imageUrl: "" });
    showPop(id, "updated");
  } catch (error) {
    console.error("Error editing post:", error.message);
    alert("Error editing post: " + error.message);
  }
};

  const cancelEdit = () => {
    setEditPostId(null);
    setEditPostFields({ title: "", content: "", imageUrl: "" });
  };

  const askDeletePost = (id) => {
    setMenuOpenId(null);
    setConfirmDeleteId(id);
  };
  const cancelDeletePost = () => setConfirmDeleteId(null);

  const deletePost = async (id) => {
    setConfirmDeleteId(null);
    try {
      const response = await fetch(`https://final-api-qnqq.onrender.com/api/posts/${id}`, {
        method: "DELETE"
      });
      if (!response.ok) {
        let errorText;
        try {
          const errJson = await response.json();
          errorText = errJson.message || JSON.stringify(errJson);
        } catch {
          errorText = await response.text();
        }
        throw new Error(errorText || "Failed to delete post");
      }
      setPosts(prev => prev.filter(post => post.id !== id));
      showPop(id, "deleted");
    } catch (error) {
      console.error("Error deleting post:", error.message);
      alert("Error deleting post: " + error.message);
    }
  };

  const showPop = (id, type) => {
    setPopMessages((prev) => ({ ...prev, [id]: type }));
    setTimeout(() => {
      setPopMessages((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    }, 1500);
  };

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  useEffect(() => {
    if (lightboxImg) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [lightboxImg]);

  if (loading) return <p style={{ textAlign: "center" }}>Loading posts...</p>;

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "20px auto",
        fontFamily: bodyFont,
        position: "relative"
      }}
    >
      <div
        style={{
          textAlign: "center",
          marginBottom: 30,
          padding: "20px 0",
          background:
            "repeating-linear-gradient(135deg, #6e8efb, #a777e3 80px, #6e8efb 160px, #a777e3 240px)",
          color: "white",
          borderRadius: 8,
          boxShadow: "0 4px 15px rgba(0,0,0,0.18)",
          position: "relative",
          userSelect: "none",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: "2.7rem",
            fontWeight: "bold",
            fontFamily: bodyFont,
            textShadow: "2px 2px 8px #23213a70, 0 1px 0 #fff",
            letterSpacing: "1.5px",
            lineHeight: 1.1,
            WebkitTextStroke: "1px #fff8",
            filter: "drop-shadow(0 2px 1px #a777e380)",
            transition: "color .2s"
          }}
        >
          Animedia
        </h1>
        <p
          style={{
            margin: "8px 0 0",
            fontSize: "1.07rem",
            opacity: 0.92,
            textShadow: "1px 1px 2px #23213a50"
          }}
        >
          Your anime social community
        </p>
        <button
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          onClick={toggleDarkMode}
          style={{
            position: "absolute",
            top: 14,
            right: 20,
            background: "rgba(255,255,255,0.15)",
            border: "none",
            borderRadius: "50%",
            width: 38,
            height: 38,
            color: "white",
            fontSize: 19,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 2px 8px #0003",
            transition: "background .2s"
          }}
        >
          {darkMode ? <FaRegSun /> : <FaRegMoon />}
        </button>
      </div>

      <div style={{ marginBottom: 20 }}>
        {!showCreatePost && (
          <button
            onClick={() => setShowCreatePost(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 16px",
              backgroundColor: "#a777e3",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: 16,
              width: "100%",
              justifyContent: "center",
              boxShadow: darkMode
                ? "0 1.5px 5px #23213a2b"
                : "0 2px 8px #a777e350",
            }}
          >
            <FaPlus />
            Create Post
          </button>
        )}

        <div
          style={{
            maxHeight: showCreatePost ? "1000px" : "0",
            overflow: "hidden",
            transition: "max-height 0.3s ease-out",
            border: showCreatePost ? "1.5px solid #bcb3e4" : "none",
            borderRadius: 8,
            padding: showCreatePost ? 16 : 0,
            marginTop: showCreatePost ? 10 : 0,
            boxShadow: showCreatePost
              ? "0 2px 12px rgba(167,119,227,.13)"
              : "none",
            background: darkMode ? "#211f2e" : "#fff",
            fontFamily: bodyFont,
            boxSizing: "border-box",
            position: "relative"
          }}
        >
          {showCreatePost && (
            <button
              onClick={() => setShowCreatePost(false)}
              aria-label="Close"
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                background: "#a777e3",
                color: "white",
                border: "none",
                borderRadius: "50%",
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: 18,
                zIndex: 2,
                boxShadow: "0 1.5px 5px #23213a2b",
              }}
            >
              <FaTimes />
            </button>
          )}
          {showCreatePost && (
            <form onSubmit={submitPost}>
              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: 0,
              }}>
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>
                    Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={newPost.title}
                    onChange={handlePostChange}
                    required
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 6,
                      border: "1.5px solid #bcb3e4",
                      fontSize: 15,
                      background: darkMode ? "#2a2540" : "#fff",
                      color: darkMode ? "#e0d9ff" : "#23213a",
                      fontFamily: bodyFont,
                      marginBottom: 0,
                      boxSizing: "border-box"
                    }}
                  />
                </div>
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>
                    Content
                  </label>
                  <textarea
                    name="content"
                    value={newPost.content}
                    onChange={handlePostChange}
                    required
                    rows={4}
                    style={{
                      width: "100%",
                      minHeight: 70,
                      padding: "10px 12px",
                      borderRadius: 6,
                      border: "1.5px solid #bcb3e4",
                      fontSize: 15,
                      background: darkMode ? "#2a2540" : "#fff",
                      color: darkMode ? "#e0d9ff" : "#23213a",
                      fontFamily: bodyFont,
                      resize: "vertical",
                      marginBottom: 0,
                      boxSizing: "border-box"
                    }}
                  />
                </div>
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>
                    Image URL (optional)
                  </label>
                  <input
                    type="text"
                    name="imageUrl"
                    value={newPost.imageUrl}
                    onChange={handlePostChange}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 6,
                      border: "1.5px solid #bcb3e4",
                      fontSize: 15,
                      background: darkMode ? "#2a2540" : "#fff",
                      color: darkMode ? "#e0d9ff" : "#23213a",
                      fontFamily: bodyFont,
                      marginBottom: 0,
                      boxSizing: "border-box"
                    }}
                  />
                </div>
                <div style={{ marginBottom: 22 }}>
                  <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>
                    Author
                  </label>
                  <input
                    type="text"
                    name="author"
                    value={newPost.author}
                    onChange={handlePostChange}
                    required
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 6,
                      border: "1.5px solid #bcb3e4",
                      fontSize: 15,
                      background: darkMode ? "#2a2540" : "#fff",
                      color: darkMode ? "#e0d9ff" : "#23213a",
                      fontFamily: bodyFont,
                      marginBottom: 0,
                      boxSizing: "border-box"
                    }}
                  />
                </div>
                <button
                  type="submit"
                  style={{
                    backgroundColor: "#705be7",
                    color: "white",
                    border: "none",
                    padding: "12px 0",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: 17,
                    width: "100%",
                    marginTop: 0,
                    transition: "background .17s"
                  }}
                >
                  Post
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {!posts.length ? (
        <p style={{ textAlign: "center" }}>No posts available.</p>
      ) : (
        posts.map((post) => {
          const { id, author, title, content, imageUrl, timestamp } = post;
          const isEditing = editPostId === id;

          return (
            <div
              key={id}
              className={`animedia-post-card ${darkMode ? "dark" : ""}`}
              style={{
                position: "relative",
                border: darkMode
                  ? "1.5px solid #4a426f"
                  : "1.5px solid #a777e340",
                borderRadius: 11,
                padding: 16,
                marginBottom: 21,
                boxShadow: darkMode
                  ? "0 4px 22px #211f2e70, 0 1.5px 5px #0002"
                  : "0 4px 22px #a777e355, 0 1.5px 5px #a777e330",
                background: darkMode
                  ? "linear-gradient(120deg, #231d3a 80%, #18152b)"
                  : "linear-gradient(120deg, #fff 90%, #ece6fa 100%)",
                transition: "background .2s, border .2s, box-shadow .2s",
                outline: "2px solid transparent",
                outlineOffset: "2px",
                fontFamily: bodyFont,
                boxSizing: "border-box"
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  zIndex: 2,
                  cursor: "pointer",
                  userSelect: "none"
                }}
                onClick={e => {
                  e.stopPropagation();
                  setMenuOpenId(menuOpenId === id ? null : id);
                }}
              >
                <span style={{
                  fontSize: 28,
                  fontWeight: 900,
                  padding: "0 6px",
                  lineHeight: "1",
                  letterSpacing: 2,
                  color: "#888"
                }}>⋯</span>
                {menuOpenId === id && !isEditing && (
                  <div
                    onClick={e => e.stopPropagation()}
                    style={{
                      position: "absolute",
                      top: 32,
                      right: 0,
                      background: darkMode ? "#231d3a" : "#fff",
                      border: darkMode ? "1px solid #4a426f" : "1px solid #eee",
                      borderRadius: 7,
                      boxShadow: "0 6px 24px rgba(0,0,0,0.18)",
                      minWidth: 110,
                      padding: "4px 0",
                      display: "flex",
                      flexDirection: "column"
                    }}
                  >
                    <button
                      onClick={() => startEditPost(id, post)}
                      style={{
                        background: "none",
                        border: "none",
                        padding: "10px 16px",
                        textAlign: "left",
                        fontSize: 15,
                        color: darkMode ? "#f8f6ff" : "#333",
                        cursor: "pointer",
                        borderRadius: 0,
                        width: "100%",
                        outline: "none"
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => askDeletePost(id)}
                      style={{
                        background: "none",
                        border: "none",
                        padding: "10px 16px",
                        textAlign: "left",
                        fontSize: 15,
                        color: "#d32f2f",
                        cursor: "pointer",
                        borderRadius: 0,
                        width: "100%",
                        outline: "none"
                      }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {popMessages[id] && (
                <div
                  style={{
                    position: "absolute",
                    top: 60,
                    right: 16,
                    background: popBgColor[popMessages[id]],
                    color: "white",
                    padding: "8px 16px",
                    borderRadius: 30,
                    fontWeight: "bold",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.25)",
                    animation: "popFadeMove 1.5s forwards",
                    userSelect: "none",
                    pointerEvents: "none",
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    zIndex: 1000,
                  }}
                >
                  {popText[popMessages[id]]}
                </div>
              )}

              {confirmDeleteId === id && (
                <div style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  background: darkMode ? "#261d36" : "#fff",
                  color: darkMode ? "#e0d9ff" : "#23213a",
                  border: darkMode ? "1px solid #4a426f" : "1px solid #ddd",
                  borderRadius: 8,
                  boxShadow: "0 4px 32px rgba(0,0,0,0.3)",
                  padding: 24,
                  zIndex: 2000,
                  width: "90%",
                  maxWidth: 340,
                  textAlign: "center"
                }}>
                  <p style={{ margin: "0 0 16px", fontWeight: "bold" }}>
                    Are you sure you want to delete this post?
                  </p>
                  <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
                    <button
                      onClick={() => deletePost(id)}
                      style={{
                        background: "#ff595e",
                        color: "white",
                        border: "none",
                        borderRadius: 5,
                        padding: "8px 16px",
                        fontWeight: "bold",
                        cursor: "pointer"
                      }}
                    >
                      Yes, Delete
                    </button>
                    <button
                      onClick={cancelDeletePost}
                      style={{
                        background: darkMode ? "#44405e" : "#ccc",
                        color: darkMode ? "#e0d9ff" : "#333",
                        border: "none",
                        borderRadius: 5,
                        padding: "8px 16px",
                        fontWeight: "bold",
                        cursor: "pointer"
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {confirmUpdateId === id && (
                <div style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  background: darkMode ? "#261d36" : "#fff",
                  color: darkMode ? "#e0d9ff" : "#23213a",
                  border: darkMode ? "1px solid #4a426f" : "1px solid #ddd",
                  borderRadius: 8,
                  boxShadow: "0 4px 32px rgba(0,0,0,0.3)",
                  padding: 24,
                  zIndex: 2000,
                  width: "90%",
                  maxWidth: 340,
                  textAlign: "center"
                }}>
                  <p style={{ margin: "0 0 16px", fontWeight: "bold" }}>
                    Are you sure you want to update this post?
                  </p>
                  <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
                    <button
                      onClick={() => saveEditPost(id)}
                      style={{
                        background: "#1abc9c",
                        color: "white",
                        border: "none",
                        borderRadius: 5,
                        padding: "8px 16px",
                        fontWeight: "bold",
                        cursor: "pointer"
                      }}
                    >
                      Yes, Update
                    </button>
                    <button
                      onClick={cancelUpdateConfirm}
                      style={{
                        background: darkMode ? "#44405e" : "#ccc",
                        color: darkMode ? "#e0d9ff" : "#333",
                        border: "none",
                        borderRadius: 5,
                        padding: "8px 16px",
                        fontWeight: "bold",
                        cursor: "pointer"
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {isEditing ? (
                <div>
                  <input
                    type="text"
                    name="title"
                    value={editPostFields.title}
                    onChange={handleEditPostChange}
                    required
                    style={{
                      width: "100%",
                      padding: 8,
                      borderRadius: 4,
                      border: "1px solid #ccc",
                      fontSize: 16,
                      fontWeight: "bold",
                      marginBottom: 10,
                      fontFamily: bodyFont,
                      boxSizing: "border-box"
                    }}
                  />
                  <textarea
                    name="content"
                    value={editPostFields.content}
                    onChange={handleEditPostChange}
                    required
                    rows={4}
                    style={{
                      width: "100%",
                      padding: 8,
                      borderRadius: 4,
                      border: "1px solid #ccc",
                      fontSize: 14,
                      resize: "vertical",
                      marginBottom: 10,
                      fontFamily: bodyFont,
                      boxSizing: "border-box"
                    }}
                  />
                  <input
                    type="text"
                    name="imageUrl"
                    value={editPostFields.imageUrl}
                    onChange={handleEditPostChange}
                    placeholder="Image URL (optional)"
                    style={{
                      width: "100%",
                      padding: 8,
                      borderRadius: 4,
                      border: "1px solid #ccc",
                      fontSize: 14,
                      marginBottom: 10,
                      fontFamily: bodyFont,
                      boxSizing: "border-box"
                    }}
                  />
                  <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                    <button
                      type="button"
                      onClick={() => confirmUpdate(id)}
                      style={{
                        backgroundColor: "#ffa502",
                        color: "white",
                        border: "none",
                        padding: "8px 16px",
                        borderRadius: 4,
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: 15,
                      }}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      style={{
                        backgroundColor: "#ccc",
                        color: "#444",
                        border: "none",
                        padding: "8px 16px",
                        borderRadius: 4,
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: 15,
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 style={{ margin: "0 0 8px" }}>{title}</h3>
                  <p style={{
                    fontSize: 14,
                    color: darkMode ? "#e0d9ff" : "#555",
                    margin: "0 0 12px"
                  }}>
                    by <strong>{author}</strong> — <em>{getRelativeTime(timestamp)}</em>
                  </p>
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt={title}
                      style={{
                        width: "100%",
                        maxHeight: 300,
                        objectFit: "cover",
                        borderRadius: 6,
                        marginBottom: 12,
                        boxShadow: "0 2px 15px #a777e366, 0 1.5px 4px #0003",
                        cursor: "zoom-in",
                        outline: darkMode ? "2px solid #4a426f" : "2px solid #a777e3",
                        transition: "outline .15s"
                      }}
                      onClick={() => setLightboxImg(imageUrl)}
                    />
                  )}
                  <p
                    style={{
                      whiteSpace: "pre-wrap",
                      lineHeight: 1.46,
                      color: darkMode ? "#d4d1e3" : "#333"
                    }}
                  >
                    {content}
                  </p>
                </>
              )}

              {!isEditing && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-around",
                    marginTop: 12,
                    borderTop: darkMode ? "1px solid #392d5e" : "1px solid #eee",
                    paddingTop: 12,
                  }}
                >
                  <button
                    onClick={() => handleLike(id)}
                    style={{
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      color: likes[id] ? "#e0245e" : darkMode ? "#f8f6ff" : "#555",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontWeight: "bold",
                      fontSize: 14,
                    }}
                  >
                    {likes[id] ? <FaHeart /> : <FaRegHeart />} Like
                  </button>

                  <button
                    onClick={() => toggleComments(id)}
                    style={{
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      color: darkMode ? "#f8f6ff" : "#555",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontWeight: "bold",
                      fontSize: 14,
                    }}
                  >
                    <FaComment /> Comment
                  </button>

                  <button
                    onClick={() => handleShare(id)}
                    style={{
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      color: darkMode ? "#f8f6ff" : "#555",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontWeight: "bold",
                      fontSize: 14,
                    }}
                  >
                    <FaShare /> Share
                  </button>
                </div>
              )}

              {showComments[id] && (
                <div
                  style={{
                    marginTop: 12,
                    borderTop: darkMode ? "1px solid #392d5e" : "1px solid #eee",
                    paddingTop: 12,
                  }}
                >
                  {(comments[id] || []).map((comment) => (
                    <p
                      key={comment.id}
                      style={{
                        backgroundColor: darkMode ? "#312a45" : "#f0f0f0",
                        color: darkMode ? "#e0d9ff" : "#222",
                        padding: 8,
                        borderRadius: 4,
                        marginBottom: 6,
                        fontSize: 14,
                      }}
                    >
                      <strong>{comment.author}</strong>: {comment.content}
                    </p>
                  ))}

                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      type="text"
                      placeholder="Write a comment..."
                      value={commentInputs[id] || ""}
                      onChange={(e) => handleCommentChange(id, e.target.value)}
                      style={{
                        flexGrow: 1,
                        padding: 8,
                        borderRadius: 4,
                        border: darkMode ? "1px solid #4a426f" : "1px solid #ccc",
                        fontSize: 14,
                        background: darkMode ? "#23213a" : "#fff",
                        color: darkMode ? "#e0d9ff" : "#222",
                        fontFamily: bodyFont,
                        boxSizing: "border-box"
                      }}
                    />
                    <button
                      onClick={() => addComment(id)}
                      style={{
                        backgroundColor: "#1da1f2",
                        color: "white",
                        border: "none",
                        padding: "8px 12px",
                        borderRadius: 4,
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: 14,
                      }}
                    >
                      Post
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}

      {lightboxImg && (
        <div
          onClick={() => setLightboxImg(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            zIndex: 4000,
            width: "100vw",
            height: "100vh",
            background: "rgba(34,25,58,0.92)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "zoom-out",
            animation: "fadeLightboxIn .15s"
          }}
        >
          <img
            src={lightboxImg}
            alt="enlarged anime post"
            style={{
              maxWidth: "93vw",
              maxHeight: "87vh",
              borderRadius: 12,
              boxShadow: "0 8px 40px #23213a, 0 2px 7px #a777e3aa",
              border: "3.5px solid #fff",
              background: "#fff"
            }}
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={() => setLightboxImg(null)}
            style={{
              position: "absolute",
              top: 25,
              right: 35,
              background: "rgba(0,0,0,0.33)",
              color: "#fff",
              border: "none",
              borderRadius: "50%",
              width: 40,
              height: 40,
              fontSize: 21,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              zIndex: 10,
              boxShadow: "0 1.5px 5px #0002"
            }}
            aria-label="Close lightbox"
          >
            <FaTimes />
          </button>
          <style>
            {`
              @keyframes fadeLightboxIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }
            `}
          </style>
        </div>
      )}

      <style>
        {`
          @keyframes popFadeMove {
            0% {
              opacity: 1;
              transform: translateY(0);
            }
            100% {
              opacity: 0;
              transform: translateY(-20px);
            }
          }
          body.animedia-dark {
            background: linear-gradient(120deg, #1b1730 60%, #a777e315 100%);
            color: #e0d9ff;
            transition: background .25s;
            font-family: ${bodyFont};
          }
          .animedia-post-card,
          input,
          textarea {
            box-sizing: border-box !important;
          }
          .animedia-post-card.dark {
            color: #e0d9ff;
            font-family: ${bodyFont};
          }
        `}
      </style>
    </div>
  );
}