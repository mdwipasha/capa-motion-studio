# PRD.md

# Capa Motion Studio - Product Requirements Document

## 1. Overview

Capa Motion Studio adalah desktop application yang membantu developer Roblox membuat, mengedit, dan menghasilkan animasi karakter dengan lebih cepat.

Aplikasi ini tidak bertujuan menggantikan animator, tetapi mempercepat workflow dengan menghasilkan draft animasi yang masih dapat diedit sebelum di-export ke Roblox.

---

# 2. Goals

Menyediakan workflow sederhana:

Video / Motion Input

↓

Generate Draft Animation

↓

Edit Timeline

↓

Export FBX

↓

Import ke Roblox Studio

Semua proses berjalan secara lokal tanpa bergantung pada cloud.

---

# 3. Target Users

* Roblox Developer
* Roblox Animator
* Indie Studio
* Solo Developer

---

# 4. Supported Rig

Harus mendukung:

* Roblox R6
* Roblox R15

Target rig dipilih saat membuat project.

---

# 5. MVP Features

## Project

* Create Project
* Open Project
* Save Project
* Recent Projects

## Motion Editor

* Timeline
* Play
* Pause
* Stop
* Keyframe
* Bone Selection
* Bone Rotation
* Undo
* Redo

## Preview

* 3D Preview
* Camera Control
* Animation Playback

## Import / Export

* Import FBX
* Export FBX

---

# 6. Future Features

* Video → Animation
* Text → Animation
* AI Motion Cleanup
* Motion Library
* Auto Loop
* Animation Templates

---

# 7. Out of Scope (MVP)

Tidak dikerjakan pada versi pertama:

* Facial Animation
* Finger Animation
* Physics Simulation
* Cloth Simulation
* Multiplayer Collaboration
* Cloud Sync

---

# 8. Design Principles

* Cepat digunakan.
* Mudah dipelajari.
* Fokus pada workflow Roblox.
* Semua data diproses secara lokal.
* AI hanya membantu, bukan menggantikan editor.

---

# 9. Success Criteria

Project dianggap berhasil apabila pengguna dapat:

1. Membuat project.
2. Mengedit animasi.
3. Menyimpan project.
4. Membuka project kembali.
5. Export FBX.
6. Menggunakan hasilnya di Roblox Studio.

Versi berikutnya menambahkan AI tanpa mengubah workflow editor.