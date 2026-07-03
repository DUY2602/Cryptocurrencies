<script setup>
/**
 * RichTextEditor — TipTap v3 wrapper for Vue 3.
 *
 * Features:
 *   - bold, italic, underline, strike, inline code
 *   - H1..H4 + paragraph
 *   - bullet / ordered list, blockquote, code block, horizontal rule
 *   - inline links
 *   - embedded images (by URL, file picker, or paste)
 *   - text underline
 *   - undo / redo
 *   - live word/char counter
 *   - v-model compatible
 *
 * Headless: this component owns the toolbar UI so it blends with the
 * dark, Binance-style theme.
 */

import { ref, watch, onBeforeUnmount, computed } from "vue";
import { useEditor, EditorContent } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";

const props = defineProps({
  modelValue: { type: String, default: "" },
  placeholder: { type: String, default: "Write your article..." },
  minHeight: { type: Number, default: 320 },
  maxLength: { type: Number, default: 0 }, // 0 = unlimited
});
const emit = defineEmits(["update:modelValue"]);

const linkUrl = ref("");
const showLinkInput = ref(false);
const showImageInput = ref(false);
const imageUrl = ref("");
const fileInput = ref(null);

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit.configure({
      heading: { levels: [1, 2, 3, 4] },
    }),
    Underline,
    Link.configure({
      openOnClick: false,
      autolink: true,
      HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
    }),
    Image.configure({ inline: false, allowBase64: true }),
    Placeholder.configure({ placeholder: props.placeholder }),
  ],
  editorProps: {
    attributes: {
      class: "tiptap-content",
      style: `min-height: ${props.minHeight}px;`,
    },
    handlePaste(view, event) {
      // Convert pasted images to base64 embeds
      const items = event.clipboardData?.items;
      if (!items) return false;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            insertImageFile(file);
            return true;
          }
        }
      }
      return false;
    },
    handleDrop(view, event) {
      const files = event.dataTransfer?.files;
      if (!files || !files.length) return false;
      for (const f of files) {
        if (f.type.startsWith("image/")) {
          event.preventDefault();
          insertImageFile(f);
          return true;
        }
      }
      return false;
    },
  },
  onUpdate({ editor }) {
    emit("update:modelValue", editor.getHTML());
  },
});

// Keep editor in sync if parent resets the value
watch(
  () => props.modelValue,
  (val) => {
    if (!editor.value) return;
    if (val === editor.value.getHTML()) return;
    editor.value.commands.setContent(val || "", false);
  },
);

onBeforeUnmount(() => {
  editor.value?.destroy();
});

/* --------------- computed stats --------------- */

const stats = computed(() => {
  if (!editor.value) return { words: 0, chars: 0 };
  const plain = editor.value.getText();
  const words = plain.trim() ? plain.trim().split(/\s+/).length : 0;
  return { words, chars: plain.length };
});

/* --------------- toolbar helpers --------------- */

function isActive(name, attrs) {
  return editor.value?.isActive(name, attrs) ?? false;
}

function toggleLink() {
  if (!editor.value) return;
  const previous = editor.value.getAttributes("link").href || "";
  linkUrl.value = previous;
  showLinkInput.value = !showLinkInput.value;
}

function applyLink() {
  if (!editor.value) return;
  const url = linkUrl.value.trim();
  if (!url) {
    editor.value.chain().focus().extendMarkRange("link").unsetLink().run();
  } else {
    editor.value
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url })
      .run();
  }
  showLinkInput.value = false;
  linkUrl.value = "";
}

function openImage() {
  if (!editor.value) return;
  showImageInput.value = !showImageInput.value;
  imageUrl.value = "";
}

function applyImageUrl() {
  if (!editor.value) return;
  const url = imageUrl.value.trim();
  if (!url) return;
  editor.value.chain().focus().setImage({ src: url }).run();
  showImageInput.value = false;
  imageUrl.value = "";
}

function pickFile() {
  fileInput.value?.click();
}

function onFilePicked(e) {
  const f = e.target.files?.[0];
  if (f) insertImageFile(f);
  e.target.value = "";
}

function insertImageFile(file) {
  if (!editor.value) return;
  if (file.size > 2 * 1024 * 1024) {
    alert("Image too large. Max 2MB.");
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    editor.value.chain().focus().setImage({ src: reader.result }).run();
  };
  reader.readAsDataURL(file);
}

function chain(fn) {
  return () => {
    fn(editor.value.chain().focus()).run();
  };
}
</script>

<template>
  <div class="rich-editor">
    <!-- Toolbar -->
    <div class="rt-toolbar" role="toolbar" aria-label="Formatting">
      <div class="rt-group">
        <button
          type="button"
          class="rt-btn"
          :class="{ active: isActive('bold') }"
          title="Bold (Ctrl+B)"
          @click="chain((c) => c.toggleBold())()"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          class="rt-btn"
          :class="{ active: isActive('italic') }"
          title="Italic (Ctrl+I)"
          @click="chain((c) => c.toggleItalic())()"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          class="rt-btn"
          :class="{ active: isActive('underline') }"
          title="Underline (Ctrl+U)"
          @click="chain((c) => c.toggleUnderline())()"
        >
          <u>U</u>
        </button>
        <button
          type="button"
          class="rt-btn"
          :class="{ active: isActive('strike') }"
          title="Strikethrough"
          @click="chain((c) => c.toggleStrike())()"
        >
          <s>S</s>
        </button>
        <button
          type="button"
          class="rt-btn"
          :class="{ active: isActive('code') }"
          title="Inline code"
          @click="chain((c) => c.toggleCode())()"
        >
          <code>&lt;/&gt;</code>
        </button>
      </div>

      <div class="rt-divider" />

      <div class="rt-group">
        <button
          v-for="lvl in [1, 2, 3, 4]"
          :key="lvl"
          type="button"
          class="rt-btn rt-heading"
          :class="{ active: isActive('heading', { level: lvl }) }"
          :title="`Heading ${lvl}`"
          @click="chain((c) => c.toggleHeading({ level: lvl }))()"
        >
          H{{ lvl }}
        </button>
        <button
          type="button"
          class="rt-btn"
          :class="{ active: isActive('paragraph') }"
          title="Paragraph"
          @click="chain((c) => c.setParagraph())()"
        >
          ¶
        </button>
      </div>

      <div class="rt-divider" />

      <div class="rt-group">
        <button
          type="button"
          class="rt-btn"
          :class="{ active: isActive('bulletList') }"
          title="Bullet list"
          @click="chain((c) => c.toggleBulletList())()"
        >
          •
        </button>
        <button
          type="button"
          class="rt-btn"
          :class="{ active: isActive('orderedList') }"
          title="Numbered list"
          @click="chain((c) => c.toggleOrderedList())()"
        >
          1.
        </button>
        <button
          type="button"
          class="rt-btn"
          :class="{ active: isActive('blockquote') }"
          title="Blockquote"
          @click="chain((c) => c.toggleBlockquote())()"
        >
          &ldquo;&rdquo;
        </button>
        <button
          type="button"
          class="rt-btn"
          :class="{ active: isActive('codeBlock') }"
          title="Code block"
          @click="chain((c) => c.toggleCodeBlock())()"
        >
          { }
        </button>
      </div>

      <div class="rt-divider" />

      <div class="rt-group">
        <button
          type="button"
          class="rt-btn"
          :class="{ active: isActive('link') }"
          title="Insert / edit link"
          @click="toggleLink"
        >
          <Link :size="16" />
        </button>
        <button
          type="button"
          class="rt-btn"
          :class="{ active: showImageInput }"
          title="Insert image"
          @click="openImage"
        >
          <Image :size="16" />
        </button>
        <button
          type="button"
          class="rt-btn"
          title="Upload image from device"
          @click="pickFile"
        >
          <Paperclip :size="16" />
        </button>
        <button
          type="button"
          class="rt-btn"
          title="Horizontal rule"
          @click="chain((c) => c.setHorizontalRule())()"
        >
          ―
        </button>
      </div>

      <div class="rt-divider" />

      <div class="rt-group">
        <button
          type="button"
          class="rt-btn"
          title="Undo (Ctrl+Z)"
          @click="chain((c) => c.undo())()"
        >
          ↶
        </button>
        <button
          type="button"
          class="rt-btn"
          title="Redo (Ctrl+Y)"
          @click="chain((c) => c.redo())()"
        >
          ↷
        </button>
      </div>

      <div class="rt-spacer" />

      <div class="rt-stats">
        <span><FileText :size="16" /> {{ stats.words }} words</span>
        <span v-if="maxLength" :class="{ over: stats.chars > maxLength }">
          {{ stats.chars }}/{{ maxLength }}
        </span>
      </div>
    </div>

    <!-- Link popover -->
    <div v-if="showLinkInput" class="rt-popover">
      <input
        v-model="linkUrl"
        type="url"
        class="form-control form-control-sm"
        placeholder="https://example.com"
        @keyup.enter="applyLink"
        @keyup.esc="showLinkInput = false"
      />
      <button type="button" class="btn btn-sm btn-accent" @click="applyLink">
        Apply
      </button>
      <button
        type="button"
        class="btn btn-sm btn-outline-accent"
        @click="showLinkInput = false"
      >
        Cancel
      </button>
    </div>

    <!-- Image popover -->
    <div v-if="showImageInput" class="rt-popover">
      <input
        v-model="imageUrl"
        type="url"
        class="form-control form-control-sm"
        placeholder="https://… or click 📎 to upload"
        @keyup.enter="applyImageUrl"
        @keyup.esc="showImageInput = false"
      />
      <button
        type="button"
        class="btn btn-sm btn-accent"
        @click="applyImageUrl"
      >
        Insert
      </button>
      <button
        type="button"
        class="btn btn-sm btn-outline-accent"
        @click="showImageInput = false"
      >
        Cancel
      </button>
    </div>

    <!-- Hidden file picker -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      hidden
      @change="onFilePicked"
    />

    <!-- Editor surface -->
    <div class="rt-surface">
      <EditorContent :editor="editor" />
    </div>
  </div>
</template>

<style scoped>
.rich-editor {
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  background: var(--bg-secondary);
  overflow: hidden;
}

.rt-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.3rem;
  padding: 0.5rem 0.6rem;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
}

.rt-group {
  display: inline-flex;
  align-items: center;
  gap: 0.1rem;
}

.rt-divider {
  width: 1px;
  height: 22px;
  background: var(--border-color);
  margin: 0 0.2rem;
}

.rt-btn {
  min-width: 30px;
  height: 30px;
  padding: 0 0.4rem;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  color: var(--text-secondary);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.rt-btn:hover {
  background: var(--bg-card-hover);
  color: var(--text-primary);
  border-color: var(--border-color);
}

.rt-btn.active {
  background: rgba(240, 185, 11, 0.15);
  color: var(--accent);
  border-color: rgba(240, 185, 11, 0.4);
}

.rt-heading {
  font-weight: 700;
  font-size: 0.78rem;
}

.rt-spacer {
  flex: 1;
}

.rt-stats {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.72rem;
  color: var(--text-secondary);
  white-space: nowrap;
}

.rt-stats .over {
  color: var(--negative);
  font-weight: 600;
}

.rt-popover {
  display: flex;
  gap: 0.4rem;
  align-items: center;
  padding: 0.5rem 0.6rem;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
}

.rt-popover .form-control {
  flex: 1;
  min-width: 0;
}

.rt-surface {
  padding: 0.75rem 1rem 1rem;
  background: var(--bg-secondary);
  color: var(--text-primary);
  max-height: 70vh;
  overflow: auto;
}

/* TipTap content styling */
:deep(.tiptap-content) {
  outline: none;
  line-height: 1.65;
  font-size: 0.95rem;
  color: var(--text-primary);
}

:deep(.tiptap-content p) {
  margin: 0 0 0.6em;
}

:deep(.tiptap-content h1),
:deep(.tiptap-content h2),
:deep(.tiptap-content h3),
:deep(.tiptap-content h4) {
  font-weight: 700;
  color: var(--text-emphasis);
  margin: 1em 0 0.4em;
  line-height: 1.3;
}

:deep(.tiptap-content h1) {
  font-size: 1.5rem;
}
:deep(.tiptap-content h2) {
  font-size: 1.3rem;
}
:deep(.tiptap-content h3) {
  font-size: 1.15rem;
}
:deep(.tiptap-content h4) {
  font-size: 1rem;
}

:deep(.tiptap-content ul),
:deep(.tiptap-content ol) {
  padding-left: 1.4rem;
  margin: 0 0 0.6em;
}

:deep(.tiptap-content li) {
  margin-bottom: 0.2em;
}

:deep(.tiptap-content blockquote) {
  border-left: 3px solid var(--accent);
  padding: 0.25em 0.9em;
  color: var(--text-secondary);
  font-style: italic;
  background: rgba(240, 185, 11, 0.05);
  border-radius: 0 4px 4px 0;
  margin: 0.6em 0;
}

:deep(.tiptap-content code) {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 0 0.3em;
  font-size: 0.85em;
  font-family: ui-monospace, "JetBrains Mono", monospace;
  color: var(--accent);
}

:deep(.tiptap-content pre) {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 0.7rem 0.9rem;
  overflow-x: auto;
  font-family: ui-monospace, "JetBrains Mono", monospace;
  font-size: 0.85rem;
}

:deep(.tiptap-content pre code) {
  background: none;
  border: none;
  padding: 0;
  color: var(--text-primary);
}

:deep(.tiptap-content a) {
  color: var(--accent);
  text-decoration: underline;
}

:deep(.tiptap-content img) {
  max-width: 100%;
  height: auto;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  margin: 0.5em 0;
  display: block;
}

:deep(.tiptap-content hr) {
  border: none;
  border-top: 1px solid var(--border-color);
  margin: 1em 0;
}

:deep(.tiptap-content u) {
  text-decoration: underline;
  text-underline-offset: 2px;
}

/* Placeholder text */
:deep(.tiptap-content p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  color: var(--text-tertiary);
  pointer-events: none;
  height: 0;
}
</style>
