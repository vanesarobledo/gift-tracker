import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import OccasionView from '../OccasionView.vue'
import { useDataStore } from '@/stores/data'

describe('OccasionView', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
    })
    setActivePinia(createPinia())
  })

  it('groups recipients and converts an idea into a planned gift', async () => {
    const store = useDataStore()
    const matthew = store.addPerson({ name: 'Matthew' })
    const o = store.addOccasion({
      name: 'Christmas',
      date: '2026-12-25',
      recipientIds: [matthew.id],
    })
    store.addIdea({ personId: matthew.id, name: 'Telescope', price: 99 })

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'home', component: {} },
        { path: '/people/:id', name: 'person', component: {} },
      ],
    })
    const wrapper = mount(OccasionView, { props: { id: o.id }, global: { plugins: [router] } })

    expect(wrapper.text()).toContain('Needs shopping')
    expect(wrapper.text()).toContain('Telescope')

    const convert = wrapper.findAll('button').find((b) => b.text() === '→ Gift')!
    await convert.trigger('click')

    expect(wrapper.text()).toContain('Planned')
    expect(wrapper.text()).not.toContain('Needs shopping')
    expect(wrapper.text()).toContain('Total: $99.00')
    expect(store.data.ideas).toHaveLength(0)
  })
})
