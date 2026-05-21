import { gql } from '@apollo/client'

export const GET_BOOKS = gql`
  query GetBooks {
    books {
      id
      title
      year
      author {
        name
      }
    }
  }
`

export const GET_AUTHORS = gql`
  query GetAuthors {
    authors {
      id
      name
      books {
        title
      }
    }
  }
`

export const CREATE_AUTHOR = gql`
  mutation CreateAuthor($name: String!) {
    createAuthor(name: $name) {
      id
      name
    }
  }
`

export const CREATE_BOOK = gql`
  mutation CreateBook($title: String!, $authorId: ID!, $year: Int) {
    createBook(title: $title, authorId: $authorId, year: $year) {
      id
      title
      author {
        name
      }
    }
  }
`
