CREATE VIRTUAL TABLE  IF NOT EXISTS paragraphs USING fts5(
    book_id, 
    chapter_uuid UNINDEXED, 
    paragraph_uuid UNINDEXED, 
    content
);

CREATE TABLE IF NOT EXISTS chapters(
    chapter_uuid varchar(255) PRIMARY KEY, 
    book_id varchar(255), 
    chapter_index int(255),
    chapter_title varchar(255) 
);