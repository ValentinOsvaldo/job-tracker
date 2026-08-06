<script setup lang="ts">
import { marked } from 'marked'
import DOMPurify from 'isomorphic-dompurify'

const props = defineProps<{
  content: string
}>()

const SKIP_TAGS = new Set(['A', 'CODE', 'PRE'])

function highlightEmails(root: HTMLElement) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parentTag = node.parentElement?.tagName
      if (parentTag && SKIP_TAGS.has(parentTag)) return NodeFilter.FILTER_REJECT
      return NodeFilter.FILTER_ACCEPT
    }
  })

  const textNodes: Text[] = []
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    textNodes.push(node as Text)
  }

  for (const node of textNodes) {
    const text = node.textContent ?? ''
    const regex = createEmailRegex()
    let match = regex.exec(text)
    if (!match) continue

    const fragment = document.createDocumentFragment()
    let lastIndex = 0

    while (match) {
      if (isLikelyEmail(match[0])) {
        if (match.index > lastIndex) {
          fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)))
        }
        const link = document.createElement('a')
        link.href = `mailto:${match[0]}`
        link.className = 'rounded bg-warning/20 px-0.5 font-medium text-highlighted no-underline hover:underline'
        link.textContent = match[0]
        fragment.appendChild(link)
        lastIndex = match.index + match[0].length
      }
      match = regex.exec(text)
    }

    if (lastIndex === 0) continue
    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)))
    }
    node.replaceWith(fragment)
  }
}

const html = computed(() => {
  const rawHtml = DOMPurify.sanitize(marked.parse(props.content, { async: false }) as string)
  const container = document.createElement('div')
  container.innerHTML = rawHtml
  highlightEmails(container)
  return DOMPurify.sanitize(container.innerHTML)
})
</script>

<template>
  <div
    class="prose prose-sm dark:prose-invert max-w-none"
    v-html="html"
  />
</template>
