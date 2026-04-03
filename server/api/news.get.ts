export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const NEWS_API_KEY = '1ab37bb60011434a846cb415fe0f8eef'

  let url: string

  if (query.q) {
    url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(String(query.q))}&from=${query.from || ''}&sortBy=publishedAt&pageSize=${query.pageSize || 20}&page=${query.page || 1}&language=de&apiKey=${NEWS_API_KEY}`
  } else {
    url = `https://newsapi.org/v2/top-headlines?country=de&category=${query.category || 'general'}&pageSize=${query.pageSize || 20}&page=${query.page || 1}&apiKey=${NEWS_API_KEY}`
  }

  try {
    const response = await $fetch(url)
    return response
  } catch (error: any) {
    throw createError({
      statusCode: error.status || 500,
      message: error.message || 'News fetch failed'
    })
  }
})
