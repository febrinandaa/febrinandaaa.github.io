// Script to add all Facebook pages to Firestore
const admin = require('firebase-admin');

// Load service account
const serviceAccount = require('/Users/febrinanda/Downloads/fb-auto-poster-2026-a5684708e593.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const pages = [
    {
        doc_id: "FP_1",
        fb_page_id: "861658547041751",
        name: "Logika Rasa",
        access_token: "EAAaL1QDnfvEBQbPrCgmpuZBoWtxVptgFR0nrxZCSihTU7LUk1z2D8eYGOTSI0A0ohLZCLtbcjnbd7Hv0aazKRsjc6ri7Cz4avm3i4lE2I9SThlowTSMYEFCZBxek7NE8RGw5ZBNgmsLHwwyd6VXAXs1ZC2LumOfheN1aZBaDYzpXCFopR8jw5u1gNADVsaLSavqQYh4"
    },
    {
        doc_id: "FP_2",
        fb_page_id: "923965544136171",
        name: "Goresan Tinta",
        access_token: "EAAaL1QDnfvEBQZAMcoC2xjTsiYCKRi75hG4kzI6Ss9ZAnufGUQwPmPvbqqw1TY86GxLhKODe3jJD9rsXIKfqj7GJClIkKlcT8JMAALM0v5SP3JEmBZAQmsPFsi5HXcbZBFDlg4TvRhHtdmohrr9IiYLUs8FlgxeSN5tiYurwSEFZBTMsDVGZAAJFOvRnawtAJ1L2cs"
    },
    {
        doc_id: "FP_3",
        fb_page_id: "936323136233465",
        name: "Nasihat Kehidupan",
        access_token: "EAAaL1QDnfvEBQYeziDlV7w4fpudxGui6RtfgRflNRmK39ICWoZAnR4biMXQHtYmiJAZBKcA9SzO970R9sIZBKwqsVza5d4hYX7EsdujXJgobURc1CYZAXSDpOrkZA8e93cfDAmz0iciqIhR5ZAYh9dPCsinZBoEbLZAFXSsiKS91sUuWUAhKZCTcsh1vZBoQdWKyZCSk58X"
    },
    {
        doc_id: "FP_4",
        fb_page_id: "926498347218647",
        name: "Filosofi Kehidupan",
        access_token: "EAAaL1QDnfvEBQXSpVdufWXwZAZCsQNymK19B2v8Dxxml82yZAZCuCG5ZBD09fXBnIxNTvrBhLfwNby6RJhxeNV9uVkhumuCoSAexwYlt2r2YDGsoLSsm0uCzgpTytDqx4Uy6LEjI5XZCRTRcl2ilkS0vHzl5Wy0P5ydtiYMm7fn0gyRLUds2czApGYDzZBBYsT44vXl"
    },
    {
        doc_id: "FP_5",
        fb_page_id: "952318724629438",
        name: "Menjadi Manusia",
        access_token: "EAAaL1QDnfvEBQdrM51PAqcTKdtS8tRqwdAT6su2TKKPvvXc8szz5nyi9O9sZAcVFUxgXj0RTeBAYtRJ0YiNAZASuHbpXkISIQq2fvNIZCdqiBv1Ueh0VyWOuDs9lWlIZBJlTstj7TjnA9qw7o7ua59Ir5SsNTgfVtODOvGoIqsCEjFNb6tEVkVL5RxpgLq6BHaIz"
    },
    {
        doc_id: "FP_6",
        fb_page_id: "108926341958443",
        name: "Ayu Ting Ting Fans",
        access_token: "EAAaL1QDnfvEBQReittCTJoYZBbMttvXeQXZBujOz4CbZCkAg3XCuYnTNxNg4BHBEjZANYR4eWzeFiCCgdZCZAZAmXgEF9nxW7kZBp3yTiWSuHFtbZA4zCIZAy4g7TitUyO0ri6XuNe3UHnZB2xoyZCVlKgTrYoQuS6zkhMZCNa5AyoVZAoWlhZCfTBBk5os0B0BM2cIFouL4FsZD"
    },
    {
        doc_id: "FP_7",
        fb_page_id: "109076001914253",
        name: "Umi Pipik Dian Irawati",
        access_token: "EAAaL1QDnfvEBQZAHQoPE4YCJd0zGA69ce2dSgGXpokNXDN92FpHo6zXIOZA5kO95Hsg3bsFsmWVl6r14zZAMHJ71ACRKdPZAZBcLM5gPKioHCZCkoou6FynifZBqceVENlzgtZBBuGXhK7pG6719cLqQ8yb5Dkz7ymywXEuHCgIzs4rNkeIhWGz3MpLI0g5JmeqnVlwZD"
    },
    {
        doc_id: "FP_8",
        fb_page_id: "150030222333220",
        name: "Info Kesehatan",
        access_token: "EAAaL1QDnfvEBQTSFCvU6NCC1FfkMJgcXBOQSkpv2r9cS8tZAeJc0ObDdT2NMlmIgDUmktvM5B56KNJ2vYQNTRU4eW78AVPUY7hZA5j5nTc6X6ZBea6zvo9F8noVfJTDNBCZA8m9SKmcgLTEyWEviiJQ5fa69obKv2ciOW3CuOW0zJgiTyK7kSmE8Cyv08TGcEYEZD"
    },
    {
        doc_id: "FP_9",
        fb_page_id: "346791042909227",
        name: "Inspirasi Bunda",
        access_token: "EAAaL1QDnfvEBQYZCKxKJCZCk185ZAt9ZBsX7xWhgmsw9J4jdXwqu5SHYmSOEpXfczMhZBYyXDTeUfNdOPgi6YC2cZBmzEZBXrgf1FBwwIZCJpo5b8LNHBh1qce0ZCBIhsBSfwJLQYw03SY9KXJkJUoGOIfTjIL1B2V92hyj8O9EoCmSSJTqgvHnhQXY0aFRNpoCTjNe0L"
    },
    {
        doc_id: "FP_10",
        fb_page_id: "1755858221383390",
        name: "Makkah Madinah",
        access_token: "EAAaL1QDnfvEBQVdKZB6BgnUa5ZBk7jfgyiNtn86sNCyHX7sHZBQ5N93gLLfzhH9iXGcEBtqZAVKFCbKW7idBwnaMi7yWS7jF4HVfOOLs3gxJPTsNg1oYknr9PchbVpsHy86bZBrLGUOgkxaunDPA5iWOeHLhwmxEYAjswKmHTEJhET3lnDS3CnB2dpwxU0SZB53Wom"
    }
];

async function addPages() {
    console.log('Adding pages to Firestore...');

    for (const page of pages) {
        try {
            await db.collection('pages').doc(page.doc_id).set({
                fb_page_id: page.fb_page_id,
                name: page.name,
                access_token: page.access_token
            });
            console.log(`✅ Added ${page.doc_id}: ${page.name}`);
        } catch (error) {
            console.error(`❌ Error adding ${page.doc_id}:`, error);
        }
    }

    console.log('\nDone! All pages added to Firestore.');
    process.exit(0);
}

addPages();
