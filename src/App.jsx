import { useState, useCallback, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import './App.css'
import YoutubeEmbed from './YoutubeEmbed.jsx'

const STORAGE_KEY = 'rank-list-entries'

function SortableEntry({ entry, index, onDelete, onEdit }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    setActivatorNodeRef,
    isDragging,
  } = useSortable({
    id: entry.id,
    data: { entry },
  })

  const cardStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // Extract YouTube video ID from various URL formats
  const getYouTubeId = (url) => {
    if (!url) return null
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    ]
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    return null
  }

  const ytId = getYouTubeId(entry.youtube)

  return (
    <div
      ref={setNodeRef}
      style={cardStyle}
      className="entry-card"
      {...attributes}
      {...listeners}
    >
      {/* Rank number */}
      <div className="rank-number">{index + 1}</div>

      {/* Entry name */}
      <div className="entry-name">{entry.name}</div>

      {/* Custom image */}
      {entry.image && (
        <div className="entry-image">
          <img
            src={entry.image}
            alt={entry.name}
            loading="lazy"
            onError={(e) => { e.target.style.display = 'none' }}
          />
        </div>
      )}

      {/* YouTube thumbnail (right-most, non-draggable) */}
      {ytId && (
        <div
          className="entry-yt"
          onClick={(e) => e.stopPropagation()}
        >
          <YoutubeEmbed link={entry.youtube} />
        </div>
      )}

      {/* Edit button */}
      <div className='entry-buttons'>
      <button
        className="edit-btn"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation()
          onEdit(entry)
        }}
        title="Edit entry"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>

      {/* Delete button */}
      <button
        className="delete-btn"
        onClick={(e) => {
          e.stopPropagation()
          onDelete(entry.id)
        }}
        title="Delete entry"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
      </button>
      </div>
    </div>
  )
}

function AddEntryForm({ onAdd }) {
  const [name, setName] = useState('')
  const [youtube, setYoutube] = useState('')
  const [image, setImage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Name is required')
      return
    }
    onAdd({
      id: crypto.randomUUID(),
      name: trimmedName,
      youtube: youtube.trim() || undefined,
      image: image.trim() || undefined,
    })
    setName('')
    setYoutube('')
    setImage('')
    setError('')
  }

  return (
    <form className="add-form" onSubmit={handleSubmit}>
      <h2>Add Entry</h2>
      <div className="form-fields">
        <div className="form-group">
          <label htmlFor="name">Name *</label>
          <input
            id="name"
            type="text"
            placeholder="Enter name..."
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (error) setError('')
            }}
            autoFocus
          />
        </div>
        <div className="form-group">
          <label htmlFor="youtube">YouTube Link</label>
          <input
            id="youtube"
            type="text"
            placeholder="https://youtube.com/..."
            value={youtube}
            onChange={(e) => setYoutube(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="image">Image URL</label>
          <input
            id="image"
            type="text"
            placeholder="https://..."
            value={image}
            onChange={(e) => setImage(e.target.value)}
          />
        </div>
      </div>
      {error && <p className="error-message">{error}</p>}
      <button type="submit" className="add-btn">
        Add Entry
      </button>
    </form>
  )
}

function EditEntryForm({ entry, onSave, onCancel }) {
  const [name, setName] = useState(entry.name)
  const [youtube, setYoutube] = useState(entry.youtube || '')
  const [image, setImage] = useState(entry.image || '')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Name is required')
      return
    }
    onSave({
      id: entry.id,
      name: trimmedName,
      youtube: youtube.trim() || undefined,
      image: image.trim() || undefined,
    })
  }

  return (
    <form className="edit-form" onSubmit={handleSubmit}>
      <h2>Edit Entry</h2>
      <div className="form-fields">
        <div className="form-group">
          <label htmlFor="edit-name">Name *</label>
          <input
            id="edit-name"
            type="text"
            placeholder="Enter name..."
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (error) setError('')
            }}
            autoFocus
          />
        </div>
        <div className="form-group">
          <label htmlFor="edit-youtube">YouTube Link</label>
          <input
            id="edit-youtube"
            type="text"
            placeholder="https://youtube.com/..."
            value={youtube}
            onChange={(e) => setYoutube(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="edit-image">Image URL</label>
          <input
            id="edit-image"
            type="text"
            placeholder="https://..."
            value={image}
            onChange={(e) => setImage(e.target.value)}
          />
        </div>
      </div>
      {error && <p className="error-message">{error}</p>}
      <div className="edit-form-actions">
        <button type="button" className="edit-cancel-btn" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="edit-save-btn">
          Save Changes
        </button>
      </div>
    </form>
  )
}

function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="modal-actions">
          <button className="modal-cancel-btn" onClick={onCancel}>
            Cancel
          </button>
          <button className="modal-confirm-btn" onClick={onConfirm}>
            Reset List
          </button>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [entries, setEntries] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })
  const [showModal, setShowModal] = useState(false)
  const [editingEntry, setEditingEntry] = useState(null)
  const [entriesPerColumn, setEntriesPerColumn] = useState(8)

  // Split entries into columns of entriesPerColumn entries each
  const columns = (() => {
    const result = []
    for (let i = 0; i < entries.length; i += entriesPerColumn) {
      result.push(entries.slice(i, i + entriesPerColumn))
    }
    return result
  })()

  // Persist entries to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  }, [entries])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {})
  )

  const handleAdd = useCallback((entry) => {
    setEntries((prev) => [...prev, entry])
  }, [])

  const handleDelete = useCallback((id) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id))
  }, [])

  const handleEdit = useCallback((updatedEntry) => {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === updatedEntry.id ? { ...entry, ...updatedEntry } : entry
      )
    )
  }, [])

  const handleDragEnd = useCallback(
    (event) => {
      const { active, over } = event
      if (!over) return

      const activeId = active.id
      const overId = over.id

      if (activeId === overId) return

      setEntries((items) => {
        const oldIndex = items.findIndex((item) => item.id === activeId)
        const newIndex = items.findIndex((item) => item.id === overId)
        return arrayMove(items, oldIndex, newIndex)
      })
    },
    []
  )

  const handleReset = useCallback(() => {
    setEntries([])
    localStorage.removeItem(STORAGE_KEY)
    setShowModal(false)
  }, [])

  const handleResetClick = useCallback(() => {
    setShowModal(true)
  }, [])

  return (
    <div className="app">
      <header className="app-header">
        <h1>Rank List</h1>
        <p className="subtitle">
          Add entries and drag to reorder. Numbers update automatically.
        </p>
        <div className="settings-control">
          <label htmlFor="entries-per-column">Entries per column:</label>
          <select
            id="entries-per-column"
            value={entriesPerColumn}
            onChange={(e) => setEntriesPerColumn(Number(e.target.value))}
          >
            {[2, 4, 6, 8, 10, 12, 16, 20, 24].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </header>

      <AddEntryForm onAdd={handleAdd} />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={entries.map((e) => e.id)} strategy={verticalListSortingStrategy}>
          {entries.length === 0 ? (
            <div className="empty-state">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
              <p>No entries yet. Add one above!</p>
            </div>
          ) : (
            <>
              <div className="entry-columns">
                {columns.map((column, colIndex) => (
                  <>
                  <div key={colIndex} className="entry-column">
                    {column.map((entry, idx) => {
                      const globalIndex = colIndex * entriesPerColumn + idx
                      return (
                        <SortableEntry
                          key={entry.id}
                          entry={entry}
                          index={globalIndex}
                          onDelete={handleDelete}
                          onEdit={() => setEditingEntry(entry)}
                        />
                      )
                    })}
                  </div>
                  {entries.length / entriesPerColumn > colIndex+1 ? (colIndex % 2 === 0 ? (<p className='separator-line-vertical'></p>) : (<p className='separator-line-horizontal'></p>)): console.log(column.length)}
                  </>
                ))}
              </div>
              <button className="reset-btn" onClick={handleResetClick}>
                Reset List
              </button>
            </>
          )}
        </SortableContext>
      </DndContext>

      <ConfirmModal
        isOpen={showModal}
        title="Reset List"
        message="Are you sure you want to clear all entries? This cannot be undone."
        onConfirm={handleReset}
        onCancel={() => setShowModal(false)}
      />

      {editingEntry && (
        <div className="edit-modal-overlay" onClick={() => setEditingEntry(null)}>
          <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
            <EditEntryForm
              entry={editingEntry}
              onSave={(updated) => {
                handleEdit(updated)
                setEditingEntry(null)
              }}
              onCancel={() => setEditingEntry(null)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
