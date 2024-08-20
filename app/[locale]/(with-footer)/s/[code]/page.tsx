/* eslint-disable react/jsx-props-no-spreading */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/db/supabase/client';
import { getTranslations } from 'next-intl/server';

import { InfoPageSize, RevalidateOneHour } from '@/lib/constants';

import Content from './Content';

export const revalidate = RevalidateOneHour * 6;

export async function generateMetadata({
  params: { locale, code },
}: {
  params: { locale: string; code: string };
}): Promise<Metadata> {
  const supabase = createClient();
  const { data: categoryList } = await supabase.from('navigation_category').select().eq('name', code);

  if (!categoryList || !categoryList[0]) {
    notFound();
  }

  const t = await getTranslations({
    locale,
    namespace: 'Metadata.s',
  });

  const categoryName = categoryList[0].title;

  return {
    title: t('titlePrefix') + categoryName + t('titleSuffix'),
    description: t('descriptionPrefix') + categoryName + t('descriptionSuffix'),
  };
}

export default async function Page({ params }: { params: { code: string } }) {
  const supabase = createClient();
  const [{ data: categoryList }, { data: navigationList, count }] = await Promise.all([
    supabase.from('navigation_category').select().eq('name', params.code),
    supabase
      .from('web_navigation')
      .select('*', { count: 'exact' })
      .eq('category_name', params.code)
      .range(0, InfoPageSize - 1),
  ]);

  if (!categoryList || !categoryList[0]) {
    notFound();
  }

  return (
    <Content
      headerTitle={categoryList[0]!.title || params.code}
      navigationList={navigationList!}
      currentPage={1}
      total={count!}
      pageSize={InfoPageSize}
      route={`/s/${params.code}`}
    />
  );
}
