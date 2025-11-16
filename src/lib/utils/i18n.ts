export async function getTranslatedContent<T>(
  supabase: any,
  table: string,
  translationTable: string,
  locale: string,
  filters?: any
) {
  let query = supabase
    .from(table)
    .select(`
      *,
      translations:${translationTable}(*)
    `);

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
  }

  const { data, error } = await query;

  if (error) throw error;

  // Map translations to main object
  return data.map((item: any) => {
    const translation = item.translations.find((t: any) => t.locale === locale) || 
                        item.translations[0]; // Fallback to first translation
    return {
      ...item,
      ...translation,
      translations: undefined,
    };
  });
}