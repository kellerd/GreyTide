using Microsoft.Azure.Documents;
using Microsoft.Azure.Documents.Client;

namespace Azure.DocumentDBRepository
{
    interface IDocumentDBRepository<T> where T : Document
    {
        DocumentClient Client { get; }
    }
}
