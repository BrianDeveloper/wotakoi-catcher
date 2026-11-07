const MACHINE_CATEGORIES = ['anime', 'movie', 'series']

export function randomizeActiveAssignments(items, capacity = 30, random = Math.random) {
  const selectedIds = new Set()

  for (const category of MACHINE_CATEGORIES) {
    const categoryItems = items.filter((item) => item.category === category)
    for (let index = categoryItems.length - 1; index > 0; index--) {
      const swapIndex = Math.floor(random() * (index + 1))
      const current = categoryItems[index]
      categoryItems[index] = categoryItems[swapIndex]
      categoryItems[swapIndex] = current
    }

    for (const item of categoryItems.slice(0, capacity)) {
      selectedIds.add(item.id)
    }
  }

  return {
    machineIds: [...selectedIds],
    pendingIds: items.map((item) => item.id).filter((id) => !selectedIds.has(id)),
  }
}
