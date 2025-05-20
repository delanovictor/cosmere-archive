CREATE TABLE IF NOT EXISTS books(
    bookId varchar(255) PRIMARY KEY, 
    name varchar(255) 
);

CREATE TABLE IF NOT EXISTS chapters(
    chapterId varchar(255) PRIMARY KEY, 
    bookId varchar(255), 
    chapterNumber int(255),
    chapterTitle varchar(255),
    paragraphCount int,

    FOREIGN KEY (bookId)
    REFERENCES books (bookId) 
);

CREATE VIRTUAL TABLE  IF NOT EXISTS paragraphs USING fts5(
    bookId, 
    chapterId UNINDEXED, 
    paragraphNumber UNINDEXED,
    content
);


CREATE TABLE IF NOT EXISTS original_paragraphs(
    rowid int PRIMARY KEY, 
    originalContent text,

    FOREIGN KEY (rowid)
    REFERENCES paragraphs (rowid) 
);