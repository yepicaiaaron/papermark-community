/** Sample folders and files for the data room branding preview. */
// The preview page renders these with the real viewer components, so they
// are typed loosely rather than as full database rows.
export function getDataroomPreviewDataset(): {
  folders: any[];
  documents: (Record<string, any> & { versions: any[] })[];
} {
  const folders = [
    { id: "f-company", name: "Company", parentId: null, path: "/company" },
    {
      id: "f-financials",
      name: "Financials",
      parentId: null,
      path: "/financials",
    },
    { id: "f-legal", name: "Legal", parentId: null, path: "/legal" },
  ];
  const doc = (
    id: string,
    name: string,
    folderName: string | null,
    hierarchicalIndex: string,
  ) => ({
    id,
    name,
    folderName,
    hierarchicalIndex,
    dataroomDocumentId: `dd-${id}`,
    downloadOnly: false,
    canDownload: false,
    versions: [
      {
        id: `v-${id}`,
        versionNumber: 1,
        type: "pdf",
        hasPages: true,
        isVertical: true,
      },
    ],
  });
  const documents = [
    doc("d1", "Pitch deck", null, "1"),
    doc("d2", "Company overview", "Company", "2.1"),
    doc("d3", "Financial model", "Financials", "3.1"),
    doc("d4", "Cap table", "Financials", "3.2"),
    doc("d5", "Articles of association", "Legal", "4.1"),
  ];
  return { folders, documents };
}
