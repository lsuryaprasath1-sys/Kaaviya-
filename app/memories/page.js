"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function MemoriesPage() {
  // Authentication & View states
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [folderPath, setFolderPath] = useState([]); // Array of {id, name}
  
  // Data lists
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [allFolders, setAllFolders] = useState([]); // for folder select list
  
  // UI Display states
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("created_at"); // "name" | "created_at" | "file_size"
  const [sortOrder, setSortOrder] = useState("desc"); // "asc" | "desc"
  
  // Selected files for bulk operations
  const [selectedFileIds, setSelectedFileIds] = useState([]);
  
  // Upload states
  const [uploadQueue, setUploadQueue] = useState([]); // Array of {name, progress, status}
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatusMsg, setUploadStatusMsg] = useState("");
  
  // Form states (Rename, New folder, edit caption)
  const [activeModal, setActiveModal] = useState(null); // null | "new_folder" | "rename_file" | "rename_folder" | "move_files" | "edit_caption"
  const [modalTarget, setModalTarget] = useState(null); // Target object (file or folder)
  const [modalInputValue, setModalInputValue] = useState("");
  const [modalInputSecondary, setModalInputSecondary] = useState(""); // for captions
  
  const fileInputRef = useRef(null);

  // Authenticate session
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user.email === "kaaviya@birthday.com") {
        setIsAdmin(true);
      }
    };
    checkAuth();
  }, []);

  // Fetch current folder contents, load path trail, load folders tree
  useEffect(() => {
    fetchContents();
    fetchFolderTrail();
    fetchAllFoldersList();
  }, [currentFolderId, searchQuery, sortBy, sortOrder]);

  const fetchContents = async () => {
    try {
      // 1. Fetch Subfolders
      let folderQuery = supabase
        .from("folders")
        .select("*");
      
      if (currentFolderId) {
        folderQuery = folderQuery.eq("parent_id", currentFolderId);
      } else {
        folderQuery = folderQuery.is("parent_id", null);
      }
      
      const { data: dbFolders, error: foldersErr } = await folderQuery;
      if (!foldersErr) setFolders(dbFolders || []);

      // 2. Fetch Files
      let fileQuery = supabase
        .from("files")
        .select("*");

      if (currentFolderId) {
        fileQuery = fileQuery.eq("folder_id", currentFolderId);
      } else {
        fileQuery = fileQuery.is("folder_id", null);
      }

      // Add Search filter
      if (searchQuery) {
        fileQuery = fileQuery.ilike("name", `%${searchQuery}%`);
      }

      // Add Sorting
      fileQuery = fileQuery.order(sortBy, { ascending: sortOrder === "asc" });

      const { data: dbFiles, error: filesErr } = await fileQuery;
      if (!filesErr) setFiles(dbFiles || []);
    } catch (err) {
      console.error("Error fetching contents from Supabase:", err);
    }
  };

  const fetchFolderTrail = async () => {
    if (!currentFolderId) {
      setFolderPath([]);
      return;
    }
    
    try {
      let trail = [];
      let nextId = currentFolderId;
      
      while (nextId) {
        const { data, error } = await supabase
          .from("folders")
          .select("id, name, parent_id")
          .eq("id", nextId)
          .single();
          
        if (data && !error) {
          trail.unshift({ id: data.id, name: data.name });
          nextId = data.parent_id;
        } else {
          nextId = null;
        }
      }
      setFolderPath(trail);
    } catch (err) {
      console.error("Error loading folder path trail:", err);
    }
  };

  const fetchAllFoldersList = async () => {
    const { data } = await supabase.from("folders").select("id, name");
    setAllFolders(data || []);
  };

  // Navigate folder trail
  const navigateToFolder = (id) => {
    setCurrentFolderId(id);
    setSelectedFileIds([]);
  };

  // ==========================================================================
  // FILE UPLOAD PROCESS (DRAG & DROP / SELECT)
  // ==========================================================================
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAdmin) return;
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (!isAdmin) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFilesUpload(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFilesUpload(e.target.files);
    }
  };

  const handleFilesUpload = async (fileList) => {
    if (!isAdmin) return;
    setUploadStatusMsg("");
    const filesArray = Array.from(fileList);
    
    // Set initial uploads queues in UI
    const newQueue = filesArray.map(f => ({ name: f.name, progress: 0, status: "Uploading..." }));
    setUploadQueue(prev => [...prev, ...newQueue]);

    for (let i = 0; i < filesArray.length; i++) {
      const file = filesArray[i];
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
      const storagePath = `memories_${Date.now()}_${sanitizedName}`;
      
      // Determine overall category
      let fileType = "document";
      if (file.type.startsWith("image/")) fileType = "image";
      else if (file.type.startsWith("video/")) fileType = "video";

      try {
        // 1. Upload to Supabase Storage Bucket
        const { data: storageData, error: storageErr } = await supabase.storage
          .from("memories")
          .upload(storagePath, file, {
            cacheControl: "3600",
            upsert: false
          });

        if (storageErr) throw storageErr;

        // 2. Fetch Public URL
        const { data: urlData } = supabase.storage
          .from("memories")
          .getPublicUrl(storagePath);
          
        const publicUrl = urlData.publicUrl;

        // 3. Save metadata into SQL Database
        const { error: dbErr } = await supabase
          .from("files")
          .insert({
            name: file.name,
            storage_path: storagePath,
            public_url: publicUrl,
            file_type: fileType,
            mime_type: file.type,
            file_size: file.size,
            folder_id: currentFolderId,
            is_gallery_photo: fileType === "image" || fileType === "video" // auto enable gallery checkbox for images/videos
          });

        if (dbErr) throw dbErr;

        // Update queue item progress
        setUploadQueue(prev => prev.map(item => 
          item.name === file.name ? { ...item, progress: 100, status: "Complete" } : item
        ));
      } catch (err) {
        console.error("Upload error details:", err);
        setUploadQueue(prev => prev.map(item => 
          item.name === file.name ? { ...item, progress: 0, status: "Failed: " + err.message } : item
        ));
      }
    }

    setUploadStatusMsg("Uploaded successfully ❤️");
    fetchContents();
    setTimeout(() => {
      setUploadQueue([]);
      setUploadStatusMsg("");
    }, 4000);
  };

  // ==========================================================================
  // MANAGER CRUD OPERATIONS (ADMIN ONLY)
  // ==========================================================================
  const triggerModal = (type, target = null) => {
    setActiveModal(type);
    setModalTarget(target);
    if (type === "rename_file" || type === "rename_folder") {
      setModalInputValue(target.name);
    } else if (type === "edit_caption") {
      setModalInputValue(target.caption || "");
    } else {
      setModalInputValue("");
    }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;

    try {
      if (activeModal === "new_folder") {
        const { error } = await supabase
          .from("folders")
          .insert({
            name: modalInputValue,
            parent_id: currentFolderId
          });
        if (error) throw error;
      } 
      else if (activeModal === "rename_folder") {
        const { error } = await supabase
          .from("folders")
          .update({ name: modalInputValue })
          .eq("id", modalTarget.id);
        if (error) throw error;
      } 
      else if (activeModal === "rename_file") {
        const { error } = await supabase
          .from("files")
          .update({ name: modalInputValue })
          .eq("id", modalTarget.id);
        if (error) throw error;
      }
      else if (activeModal === "edit_caption") {
        const { error } = await supabase
          .from("files")
          .update({ caption: modalInputValue })
          .eq("id", modalTarget.id);
        if (error) throw error;
      }
      else if (activeModal === "move_files") {
        const targetFolder = modalInputValue === "root" ? null : modalInputValue;
        const targetIds = modalTarget ? [modalTarget.id] : selectedFileIds;
        
        const { error } = await supabase
          .from("files")
          .update({ folder_id: targetFolder })
          .in("id", targetIds);
        if (error) throw error;
        setSelectedFileIds([]);
      }

      fetchContents();
      setActiveModal(null);
    } catch (err) {
      alert("Operation failed: " + err.message);
    }
  };

  const handleDeleteFolder = async (folder) => {
    if (!isAdmin) return;
    if (!confirm(`Are you sure you want to delete folder "${folder.name}"? All nested contents will be removed.`)) return;

    const { error } = await supabase
      .from("folders")
      .delete()
      .eq("id", folder.id);
      
    if (!error) fetchContents();
    else alert("Delete failed: " + error.message);
  };

  const handleDeleteFile = async (file) => {
    if (!isAdmin) return;
    if (!confirm(`Are you sure you want to delete file "${file.name}"?`)) return;

    try {
      // 1. Delete from Supabase Storage
      const { error: storageErr } = await supabase.storage
        .from("memories")
        .remove([file.storage_path]);
        
      // 2. Delete from database
      const { error: dbErr } = await supabase
        .from("files")
        .delete()
        .eq("id", file.id);
        
      if (!dbErr) fetchContents();
      else alert("Delete failed: " + dbErr.message);
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  const handleBulkDelete = async () => {
    if (!isAdmin || selectedFileIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete the ${selectedFileIds.length} selected files?`)) return;

    try {
      // Retrieve files list to delete from storage
      const { data: filesToDelete } = await supabase
        .from("files")
        .select("storage_path")
        .in("id", selectedFileIds);

      if (filesToDelete && filesToDelete.length > 0) {
        const paths = filesToDelete.map(f => f.storage_path);
        await supabase.storage.from("memories").remove(paths);
      }

      const { error } = await supabase
        .from("files")
        .delete()
        .in("id", selectedFileIds);

      if (!error) {
        setSelectedFileIds([]);
        fetchContents();
      } else {
        alert("Bulk delete failed: " + error.message);
      }
    } catch (err) {
      alert("Bulk delete error: " + err.message);
    }
  };

  // Toggle homepage gallery inclusion status
  const handleToggleGallery = async (file, field) => {
    if (!isAdmin) return;
    const currentVal = file[field];
    
    const { error } = await supabase
      .from("files")
      .update({ [field]: !currentVal })
      .eq("id", file.id);

    if (!error) fetchContents();
  };

  // Format Helper
  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Selection Checkbox helpers
  const handleSelectFile = (id) => {
    setSelectedFileIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiles = () => {
    if (selectedFileIds.length === files.length) {
      setSelectedFileIds([]);
    } else {
      setSelectedFileIds(files.map(f => f.id));
    }
  };

  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "100vh", padding: "40px 20px" }}>
      <div className="main-container show" style={{ maxWidth: "1000px", padding: 0 }}>
        
        {/* Header toolbar navigation */}
        <header className="main-header" style={{ marginBottom: "25px", width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px" }}>
          <div style={{ textAlign: "left" }}>
            <h1 style={{ fontSize: "2rem", margin: 0 }}>Memories Drive</h1>
            <p className="subtitle" style={{ fontSize: "0.85rem", letterSpacing: "1px", marginTop: "5px" }}>
              {isAdmin ? "Admin Console (Full access)" : "Shared Memories (Read-only)"}
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <Link href="/" className="btn btn-secondary" style={{ padding: "10px 20px" }}>
              <i className="fas fa-home"></i> Home
            </Link>
            {isAdmin ? (
              <Link href="/admin" className="btn btn-secondary" style={{ padding: "10px 20px" }}>
                <i className="fas fa-cog"></i> Admin Panel
              </Link>
            ) : (
              <Link href="/admin" className="btn btn-primary" style={{ padding: "10px 20px" }}>
                <i className="fas fa-lock"></i> Login
              </Link>
            )}
          </div>
        </header>

        {/* DRAG & DROP ZONE (ADMIN ONLY) */}
        {isAdmin && (
          <div 
            className={`glass-panel ${dragActive ? "drag-active" : ""}`}
            style={{ 
              width: "100%", 
              border: dragActive ? "2px dashed var(--color-romantic)" : "1px dashed rgba(255,255,255,0.15)",
              padding: "40px 20px", 
              textAlign: "center", 
              marginBottom: "30px",
              cursor: "pointer",
              transition: "all 0.3s ease",
              background: dragActive ? "rgba(255, 82, 119, 0.08)" : "var(--glass-bg)"
            }}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: "none" }} 
              multiple 
              onChange={handleFileSelect} 
            />
            <i className="fas fa-cloud-upload-alt" style={{ fontSize: "3rem", color: "var(--color-romantic)", marginBottom: "15px" }}></i>
            <h3 style={{ fontSize: "1.2rem", fontWeight: "600", marginBottom: "5px" }}>Drop your memories here</h3>
            <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.5)" }}>Photos, Videos & PDFs • Upload multiple files simultaneously</p>
            {uploadStatusMsg && <p style={{ color: "var(--color-romantic)", fontWeight: "bold", marginTop: "15px" }}>{uploadStatusMsg}</p>}
          </div>
        )}

        {/* Uploading Queue Display */}
        {uploadQueue.length > 0 && (
          <div className="glass-panel" style={{ width: "100%", padding: "20px", marginBottom: "30px" }}>
            <h4 style={{ fontSize: "1rem", marginBottom: "12px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "6px" }}>Upload Queue</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {uploadQueue.map((item, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem" }}>
                  <span style={{ maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</span>
                  <span style={{ color: item.status.startsWith("Failed") ? "#ff4d4d" : "var(--color-romantic)" }}>{item.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* File Manager Toolbar */}
        <div className="glass-panel" style={{ width: "100%", padding: "20px", marginBottom: "25px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "15px", alignItems: "center" }}>
          {/* Path Navigation Trail */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.95rem", fontWeight: "600" }}>
            <span style={{ cursor: "pointer", color: "var(--color-romantic)" }} onClick={() => navigateToFolder(null)}>Root</span>
            {folderPath.map((item, idx) => (
              <span key={item.id} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: "rgba(255,255,255,0.3)" }}>/</span>
                <span 
                  style={{ cursor: "pointer", color: idx === folderPath.length - 1 ? "#fff" : "var(--color-romantic)" }}
                  onClick={() => navigateToFolder(item.id)}
                >
                  {item.name}
                </span>
              </span>
            ))}
          </div>

          {/* Search, Sort and Layout Controls */}
          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
            <div className="search-box-wrapper" style={{ position: "relative" }}>
              <input 
                type="text" 
                placeholder="Search files..." 
                className="form-control" 
                style={{ padding: "8px 12px", width: "180px", fontSize: "0.85rem", borderRadius: "8px" }}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <select 
              className="form-control" 
              style={{ padding: "8px 10px", width: "120px", fontSize: "0.85rem", borderRadius: "8px", background: "rgba(255,255,255,0.05)" }}
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="created_at" style={{ background: "#13040e" }}>Date Uploaded</option>
              <option value="name" style={{ background: "#13040e" }}>File Name</option>
              <option value="file_size" style={{ background: "#13040e" }}>File Size</option>
            </select>

            <button 
              className="btn btn-secondary" 
              style={{ padding: "8px 12px", borderRadius: "8px" }}
              onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
            >
              <i className={`fas fa-sort-amount-${sortOrder === "asc" ? "up" : "down"}`}></i>
            </button>

            <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", padding: "2px", borderRadius: "8px" }}>
              <button 
                onClick={() => setViewMode("grid")}
                style={{ padding: "6px 10px", background: viewMode === "grid" ? "rgba(255,82,119,0.2)" : "none", border: "none", color: "#fff", cursor: "pointer", borderRadius: "6px" }}
              >
                <i className="fas fa-th-large"></i>
              </button>
              <button 
                onClick={() => setViewMode("list")}
                style={{ padding: "6px 10px", background: viewMode === "list" ? "rgba(255,82,119,0.2)" : "none", border: "none", color: "#fff", cursor: "pointer", borderRadius: "6px" }}
              >
                <i className="fas fa-list"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Action Controls */}
        {isAdmin && selectedFileIds.length > 0 && (
          <div className="glass-panel" style={{ width: "100%", padding: "12px 20px", marginBottom: "20px", background: "rgba(255, 82, 119, 0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: "600" }}>{selectedFileIds.length} files selected</span>
            <div style={{ display: "flex", gap: "10px" }}>
              <button className="btn btn-secondary" onClick={() => triggerModal("move_files")} style={{ padding: "6px 15px", fontSize: "0.8rem", borderRadius: "6px" }}>
                <i className="fas fa-folder-open"></i> Move
              </button>
              <button className="btn btn-primary" onClick={handleBulkDelete} style={{ padding: "6px 15px", fontSize: "0.8rem", borderRadius: "6px", background: "var(--color-romantic)" }}>
                <i className="fas fa-trash-alt"></i> Delete Selected
              </button>
            </div>
          </div>
        )}

        {/* Admin Toolbar Row: Create Folder */}
        {isAdmin && (
          <div style={{ width: "100%", display: "flex", justifyContent: "flex-end", marginBottom: "15px" }}>
            <button className="btn btn-secondary" onClick={() => triggerModal("new_folder")} style={{ padding: "8px 16px", borderRadius: "8px", fontSize: "0.85rem" }}>
              <i className="fas fa-folder-plus"></i> New Folder
            </button>
          </div>
        )}

        {/* FOLDERS & FILES CONTENT AREA */}
        {folders.length === 0 && files.length === 0 ? (
          <div className="glass-panel" style={{ width: "100%", padding: "60px 20px", textAlign: "center" }}>
            <i className="fas fa-folder-open" style={{ fontSize: "3rem", color: "rgba(255,255,255,0.15)", marginBottom: "15px" }}></i>
            <p style={{ color: "rgba(255,255,255,0.4)" }}>This folder is empty. Upload some memories!</p>
          </div>
        ) : viewMode === "grid" ? (
          /* GRID VIEW */
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "20px" }}>
            
            {/* Render Folders */}
            {folders.map(folder => (
              <div 
                key={folder.id} 
                className="glass-panel"
                style={{ padding: "15px", position: "relative", cursor: "pointer", display: "flex", flexDirection: "column", gap: "10px" }}
                onDoubleClick={() => navigateToFolder(folder.id)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <i className="fas fa-folder" style={{ fontSize: "2.2rem", color: "#e9c46a" }}></i>
                  {isAdmin && (
                    <div className="dropdown" style={{ position: "relative" }}>
                      <button className="dot-menu-btn" style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer" }} onClick={(e) => {
                        e.stopPropagation();
                        const action = prompt("Type 'delete' to delete folder, or enter new name to rename folder:", folder.name);
                        if (action === "delete") handleDeleteFolder(folder);
                        else if (action && action.trim() !== folder.name) {
                          setModalTarget(folder);
                          setModalInputValue(action);
                          setActiveModal("rename_folder");
                          // directly update name via modal trigger
                          supabase.from("folders").update({ name: action }).eq("id", folder.id).then(() => fetchContents());
                        }
                      }}>
                        <i className="fas fa-ellipsis-v"></i>
                      </button>
                    </div>
                  )}
                </div>
                <span style={{ fontWeight: "600", fontSize: "0.9rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} onDoubleClick={() => navigateToFolder(folder.id)}>
                  {folder.name}
                </span>
              </div>
            ))}

            {/* Render Files */}
            {files.map(file => (
              <div 
                key={file.id} 
                className="glass-panel" 
                style={{ 
                  padding: "15px", 
                  display: "flex", 
                  flexDirection: "column", 
                  gap: "10px", 
                  position: "relative",
                  borderColor: file.is_gallery_photo ? "rgba(255, 82, 119, 0.4)" : "var(--glass-border)"
                }}
              >
                {/* File Checkbox for bulk delete/move & options menu */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  {isAdmin ? (
                    <input 
                      type="checkbox" 
                      checked={selectedFileIds.includes(file.id)} 
                      onChange={() => handleSelectFile(file.id)}
                      style={{ cursor: "pointer" }}
                    />
                  ) : <span></span>}

                  <div style={{ display: "flex", gap: "8px" }}>
                    <a href={file.public_url} download={file.name} target="_blank" rel="noopener noreferrer" style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem" }}>
                      <i className="fas fa-download"></i>
                    </a>
                    {isAdmin && (
                      <button style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: "0.85rem" }} onClick={() => handleDeleteFile(file)}>
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    )}
                  </div>
                </div>

                {/* Media Preview Box */}
                <div style={{ width: "100%", height: "120px", borderRadius: "8px", overflow: "hidden", background: "rgba(0,0,0,0.2)", display: "flex", justifyContent: "center", alignItems: "center" }}>
                  {file.file_type === "image" ? (
                    <img src={file.public_url} alt={file.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : file.file_type === "video" ? (
                    <video src={file.public_url} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <i className="fas fa-file-pdf" style={{ fontSize: "2.5rem", color: "#e74c3c" }}></i>
                  )}
                </div>

                {/* Metadata details */}
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <span style={{ fontWeight: "600", fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={file.name}>
                    {file.name}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>
                    {formatBytes(file.file_size)}
                  </span>
                </div>

                {/* Admin configuration triggers (Gallery integration toggle & caption) */}
                {isAdmin && (
                  <div style={{ marginTop: "5px", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", cursor: "pointer", color: "var(--color-romantic-light)" }}>
                      <input 
                        type="checkbox" 
                        checked={file.is_gallery_photo} 
                        onChange={() => handleToggleGallery(file, "is_gallery_photo")} 
                        style={{ width: "12px", height: "12px" }}
                      />
                      Slideshow photo
                    </label>
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => triggerModal("edit_caption", file)} 
                      style={{ padding: "4px 8px", fontSize: "0.7rem", borderRadius: "4px", width: "100%", justifyContent: "center" }}
                    >
                      <i className="fas fa-edit"></i> Edit Caption
                    </button>
                  </div>
                )}
                {file.caption && !isAdmin && (
                  <p style={{ fontSize: "0.75rem", fontStyle: "italic", color: "var(--color-romantic-light)", margin: 0, textAlign: "center" }}>
                    "{file.caption}"
                  </p>
                )}
              </div>
            ))}

          </div>
        ) : (
          /* LIST VIEW */
          <div className="glass-panel" style={{ width: "100%", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", color: "var(--color-romantic-light)" }}>
                  {isAdmin && (
                    <th style={{ padding: "12px 15px", width: "40px" }}>
                      <input type="checkbox" checked={selectedFileIds.length === files.length && files.length > 0} onChange={handleSelectAllFiles} />
                    </th>
                  )}
                  <th style={{ padding: "12px 15px" }}>Name</th>
                  <th style={{ padding: "12px 15px" }}>Type</th>
                  <th style={{ padding: "12px 15px" }}>Size</th>
                  <th style={{ padding: "12px 15px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* Render Folders */}
                {folders.map(folder => (
                  <tr 
                    key={folder.id} 
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer" }}
                    onDoubleClick={() => navigateToFolder(folder.id)}
                  >
                    {isAdmin && <td></td>}
                    <td style={{ padding: "12px 15px", fontWeight: "600" }} onDoubleClick={() => navigateToFolder(folder.id)}>
                      <i className="fas fa-folder" style={{ color: "#e9c46a", marginRight: "10px" }}></i>
                      {folder.name}
                    </td>
                    <td style={{ padding: "12px 15px", color: "rgba(255,255,255,0.4)" }}>Folder</td>
                    <td style={{ padding: "12px 15px", color: "rgba(255,255,255,0.4)" }}>-</td>
                    <td style={{ padding: "12px 15px" }}>
                      {isAdmin && (
                        <button className="btn btn-secondary" style={{ padding: "4px 8px", fontSize: "0.75rem", borderRadius: "4px", background: "none" }} onClick={() => handleDeleteFolder(folder)}>
                          <i className="fas fa-trash"></i>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}

                {/* Render Files */}
                {files.map(file => (
                  <tr key={file.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    {isAdmin && (
                      <td style={{ padding: "12px 15px" }}>
                        <input type="checkbox" checked={selectedFileIds.includes(file.id)} onChange={() => handleSelectFile(file.id)} />
                      </td>
                    )}
                    <td style={{ padding: "12px 15px", fontWeight: "500" }}>
                      <i 
                        className={file.file_type === "image" ? "fas fa-image" : file.file_type === "video" ? "fas fa-video" : "fas fa-file-pdf"} 
                        style={{ color: "var(--color-romantic)", marginRight: "10px" }}
                      />
                      {file.name}
                    </td>
                    <td style={{ padding: "12px 15px", color: "rgba(255,255,255,0.5)" }}>{file.file_type.toUpperCase()}</td>
                    <td style={{ padding: "12px 15px", color: "rgba(255,255,255,0.5)" }}>{formatBytes(file.file_size)}</td>
                    <td style={{ padding: "12px 15px" }}>
                      <div style={{ display: "flex", gap: "10px" }}>
                        <a href={file.public_url} download={file.name} target="_blank" rel="noopener noreferrer" style={{ color: "#fff" }}>
                          <i className="fas fa-download"></i>
                        </a>
                        {isAdmin && (
                          <>
                            <button style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer" }} onClick={() => triggerModal("edit_caption", file)} title="Caption">
                              <i className="fas fa-comment"></i>
                            </button>
                            <button style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer" }} onClick={() => triggerModal("rename_file", file)} title="Rename">
                              <i className="fas fa-edit"></i>
                            </button>
                            <button style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer" }} onClick={() => handleDeleteFile(file)} title="Delete">
                              <i className="fas fa-trash-alt"></i>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* POPUP ACTION DIALOGS */}
      {activeModal && (
        <div className="admin-modal show" style={{ zIndex: 500 }}>
          <div className="modal-content glass-panel" style={{ maxWidth: "400px", margin: "auto", top: "15vh" }}>
            <button className="close-modal" onClick={() => setActiveModal(null)}>&times;</button>
            
            <h2 className="admin-modal-title" style={{ fontSize: "1.4rem" }}>
              {activeModal === "new_folder" && "New Folder"}
              {activeModal === "rename_folder" && "Rename Folder"}
              {activeModal === "rename_file" && "Rename File"}
              {activeModal === "edit_caption" && "Edit caption/message"}
              {activeModal === "move_files" && "Move Selected Files"}
            </h2>

            <form onSubmit={handleModalSubmit}>
              {activeModal === "move_files" ? (
                <div className="form-group">
                  <label>Select Target Folder</label>
                  <select 
                    className="form-control" 
                    value={modalInputValue} 
                    onChange={e => setModalInputValue(e.target.value)}
                    required
                  >
                    <option value="">-- Choose target folder --</option>
                    <option value="root">Root Directory</option>
                    {allFolders
                      .filter(f => f.id !== currentFolderId)
                      .map(f => (
                        <option value={f.id} key={f.id}>{f.name}</option>
                      ))
                    }
                  </select>
                </div>
              ) : (
                <div className="form-group">
                  <label>
                    {activeModal === "edit_caption" ? "Message details" : "Name"}
                  </label>
                  {activeModal === "edit_caption" ? (
                    <textarea 
                      className="form-control" 
                      rows="3" 
                      value={modalInputValue} 
                      onChange={e => setModalInputValue(e.target.value)}
                      required 
                    />
                  ) : (
                    <input 
                      type="text" 
                      className="form-control" 
                      value={modalInputValue} 
                      onChange={e => setModalInputValue(e.target.value)}
                      required 
                      autoFocus 
                    />
                  )}
                </div>
              )}

              <div style={{ marginTop: "25px", display: "flex", gap: "10px" }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }}>
                  Confirm
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
