-- CreateTable
CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "meatType" TEXT NOT NULL,
    "spiciness" TEXT NOT NULL,
    "prepTime" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "ingredients" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Search" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "query" TEXT NOT NULL,
    "filters" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SearchRecipe" (
    "searchId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,

    PRIMARY KEY ("searchId", "recipeId"),
    CONSTRAINT "SearchRecipe_searchId_fkey" FOREIGN KEY ("searchId") REFERENCES "Search" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SearchRecipe_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Search_query_filters_key" ON "Search"("query", "filters");
