export const TITLE_LIST_PAGE_SIZE = 20
const CATEGORY_LABELS = {
  anime: 'Anime',
  movie: 'Película',
  series: 'Serie',
}
const STATUS_LABELS = {
  IN_MACHINE: 'En máquina',
  PENDING: 'En cola',
  WATCHED: 'Visto',
}
const MAX_TITLE_LENGTH = 130

function escapeMarkdown(value) {
  return String(value || '').replace(/[\\_*~|`>]/g, '\\$&')
}

export function createTitleListResponse({ titles, count, page, category }) {
  const pageCount = Math.max(1, Math.ceil(count / TITLE_LIST_PAGE_SIZE))
  const currentPage = Math.min(Math.max(1, page), pageCount)
  const categoryLabel = category ? CATEGORY_LABELS[category] : 'Todas las categorías'
  const lines = titles.map((title) => {
    const name = escapeMarkdown(title.title).slice(0, MAX_TITLE_LENGTH) || 'Sin título'
    const titleCategory = CATEGORY_LABELS[title.category] || 'Sin categoría'
    const status = STATUS_LABELS[title.status] || title.status || 'Sin estado'
    return `• **${name}** · ${titleCategory} · ${status}`
  })
  const description = lines.length
    ? lines.join('\n')
    : 'No hay títulos registrados en esta categoría.'
  const categoryId = category || 'all'

  return {
    embeds: [{
      color: 0x7c3aed,
      title: '📚 Títulos de la máquina',
      description,
      footer: { text: `${categoryLabel} · ${count} títulos · Página ${currentPage}/${pageCount}` },
    }],
    components: [{
      type: 1,
      components: [
        {
          type: 2,
          style: 2,
          label: '← Anterior',
          custom_id: `titles:${categoryId}:${Math.max(1, currentPage - 1)}`,
          disabled: currentPage <= 1,
        },
        {
          type: 2,
          style: 2,
          label: 'Siguiente →',
          custom_id: `titles:${categoryId}:${Math.min(pageCount, currentPage + 1)}`,
          disabled: currentPage >= pageCount,
        },
      ],
    }],
    allowed_mentions: { parse: [] },
  }
}
