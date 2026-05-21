import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'

const typeDefs = `#graphql
  type Author {
    id: ID!
    name: String!
    books: [Book!]!
  }

  type Book {
    id: ID!
    title: String!
    year: Int
    author: Author!
  }

  type Query {
    books: [Book!]!
    book(id: ID!): Book
    authors: [Author!]!
  }

  type Mutation {
    createAuthor(name: String!): Author!
    createBook(title: String!, authorId: ID!, year: Int): Book!
  }
`

let authors = [
  { id: '1', name: 'Толстой' },
  { id: '2', name: 'Достоевский' },
]

let books = [
  { id: '1', title: 'Война и мир', year: 1869, authorId: '1' },
  { id: '2', title: 'Преступление и наказание', year: 1866, authorId: '2' },
  { id: '3', title: 'Анна Каренина', year: 1877, authorId: '1' },
]

const resolvers = {
  Query: {
    books: () => books,
    book: (_, { id }) => books.find((b) => b.id === id) || null,
    authors: () => authors,
  },
  Mutation: {
    createAuthor: (_, { name }) => {
      const author = { id: String(Date.now()), name }
      authors.push(author)
      return author
    },
    createBook: (_, { title, authorId, year }) => {
      const author = authors.find((a) => a.id === authorId)
      if (!author) throw new Error('Автор не найден')
      const book = {
        id: String(Date.now()),
        title,
        authorId,
        year: year ?? null,
      }
      books.push(book)
      return book
    },
  },
  Book: {
    author: (parent) => authors.find((a) => a.id === parent.authorId),
  },
  Author: {
    books: (parent) => books.filter((b) => b.authorId === parent.id),
  },
}

const server = new ApolloServer({ typeDefs, resolvers })

const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
})

console.log(`GraphQL: ${url}`)
