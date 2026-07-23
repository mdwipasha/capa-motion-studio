# TECH.md

# Technical Specification

## Architecture

Desktop Application

Frontend

* React
* TypeScript
* Tailwind CSS

Desktop Runtime

* Tauri 2

3D Engine

* Three.js
* React Three Fiber

AI Backend

* Python

---

# Folder Structure

/
apps/
packages/
python/
assets/
docs/

---

# Project File

Menggunakan format internal:

.rma

File ini menyimpan:

* Project Metadata
* Rig Type
* Timeline
* Keyframes
* Settings
* Version

FBX hanya digunakan saat import dan export.

---

# Supported Rig

* Roblox R6
* Roblox R15

Semua editor bekerja menggunakan Motion Data.

Retarget dilakukan ketika import atau export.

---

# AI Pipeline

Video

↓

Pose Detection

↓

Motion Reconstruction

↓

Motion Data (.rma)

↓

Timeline Editor

↓

Export FBX

---

# State Management

Frontend menggunakan Zustand.

---

# UI Principles

* Dark Theme
* Dock Layout
* Resizable Panels
* Shortcut Friendly

---

# Architecture Principles

* UI tidak boleh mengetahui implementasi AI.
* AI tidak boleh mengetahui UI.
* Engine harus reusable.
* Semua fitur baru harus modular

---

# Dependency Rules

Dependency baru hanya boleh ditambahkan apabila:

* benar-benar diperlukan
* aktif dipelihara
* ukuran kecil
* memiliki dokumentasi baik

---

# Performance Goals

* Startup cepat.
* Seluruh proses berjalan lokal.
* Mendukung project besar tanpa lag yang signifikan.

---

# Coding Standards

* TypeScript Strict Mode.
* Functional Components.
* Modular Architecture.
* Hindari dependency yang tidak diperlukan.
* Pisahkan UI, Engine, dan AI.

---

# Future Expansion

Arsitektur harus memungkinkan penambahan:

* Plugin
* AI Model baru
* Rig baru
* Export format baru

tanpa mengubah struktur utama aplikasi.
