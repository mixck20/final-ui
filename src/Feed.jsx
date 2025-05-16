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

      if (!response.ok) {
        let errorText;
        try {
          const errJson = await response.json();
          errorText = errJson.message || JSON.stringify(errJson);
        } catch {
          errorText = await response.text();
        }
        throw new Error(errorText || "Failed to edit post");
      }

      const updatedPost = await response.json();
      
      // Optimistically update the UI immediately
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === id 
            ? { 
                ...post, 
                ...updatedPost,
                // Preserve existing comments if they exist
                comments: post.comments || []
              } 
            : post
        )
      );
      
      setEditPostId(null);
      setEditPostFields({ title: "", content: "", imageUrl: "" });
      showPop(id, "updated");
    } catch (error) {
      console.error("Error editing post:", error.message);
      alert("Error editing post: " + error.message);
      // Re-fetch posts to ensure UI is in sync with backend
      fetchPosts();
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
      {/* Rest of your component remains exactly the same */}
      {/* ... */}
    </div>
  );
}