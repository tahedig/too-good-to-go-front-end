import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronDown, MapPin } from 'lucide-react'
import { Button, ButtonLink } from '@/components/ui/Button'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { TextArea } from '@/components/ui/TextArea'

interface FaqItem {
  id: string
  category: string
  question: string
  answer: string
}

const FAQ_ITEMS: readonly FaqItem[] = [
  {
    id: 'reserve',
    category: 'رزرو',
    question: 'چطور بسته را رزرو کنم؟',
    answer:
      'بسته را انتخاب کنید، بازه تحویل را ببینید و رزرو را تأیید کنید. اطلاعات رزرو در سفارشات شماست.',
  },
  {
    id: 'pickup',
    category: 'تحویل',
    question: 'برای دریافت بسته چه همراه داشته باشم؟',
    answer:
      'در بازه تحویل به نشانی فروشگاه بروید و اطلاعات رزرو را نشان دهید. یک کیسه چندبارمصرف همراه داشته باشید.',
  },
  {
    id: 'cancel',
    category: 'لغو',
    question: 'چطور رزرو را لغو کنم؟',
    answer:
      'رزرو را از سفارشات باز کنید و قانون لغو همان بسته را ببینید. اگر امکان لغو دارید، «لغو رزرو» را انتخاب کنید.',
  },
  {
    id: 'account',
    category: 'حساب',
    question: 'چطور اطلاعات حساب را تغییر دهم؟',
    answer: 'از پروفایل وارد اطلاعات شخصی شوید. پس از ویرایش نام یا شماره تلفن، «ذخیره» را بزنید.',
  },
]

function SupportDesktopHeader() {
  return (
    <header className="hidden border-b border-border-default bg-background sm:block">
      <div className="mx-auto flex h-20 w-full max-w-[1180px] items-center justify-between gap-4 px-8 lg:px-12 xl:px-20">
        <Link to="/" className="shrink-0 text-title-xl font-bold text-primary">
          ته‌دیگ
        </Link>

        <span className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-body-md text-primary">
          <span>تهران، ولیعصر</span>
          <MapPin className="size-6 shrink-0" strokeWidth={1.75} aria-hidden="true" />
        </span>
      </div>
    </header>
  )
}

export default function HelpSupportPage() {
  const [openIds, setOpenIds] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string>()
  const [submitted, setSubmitted] = useState(false)

  function toggleFaq(id: string) {
    setOpenIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = message.trim()
    if (!trimmed) {
      setError('لطفاً پیام یا پرسش خود را بنویسید.')
      setSubmitted(false)
      return
    }
    if (trimmed.length < 5) {
      setError('پیام باید حداقل ۵ حرف باشد.')
      setSubmitted(false)
      return
    }
    setError(undefined)
    setMessage('')
    setSubmitted(true)
  }

  return (
    <>
      <SupportDesktopHeader />

      <main className="mx-auto w-full max-w-[1180px]">
        <div className="flex items-center gap-3 px-4 pt-4 pb-6 sm:px-8 sm:pt-10 lg:px-12 xl:px-20">
          <h1 className="flex-1 text-title-lg text-text-primary sm:text-title-xl">
            راهنمایی و پشتیبانی
          </h1>
          <ButtonLink
            to="/profile"
            variant="secondary"
            size="sm"
            aria-label="بازگشت به پروفایل"
            className="size-11! border! border-border-default! px-0! hover:bg-surface-secondary!"
          >
            <ArrowRight className="size-6" strokeWidth={1.75} aria-hidden="true" />
          </ButtonLink>
        </div>

        <div className="flex flex-col gap-6 px-4 pb-8 sm:px-8 sm:pb-12 lg:flex-row lg:items-start lg:gap-8 lg:px-12 xl:px-40">
          <section aria-labelledby="faq-heading" className="flex min-w-0 flex-1 flex-col gap-4">
            <h2 id="faq-heading" className="text-title-md text-text-primary">
              پرسش‌های متداول
            </h2>

            <div className="flex flex-col gap-4">
              {FAQ_ITEMS.map((faq) => {
                const isOpen = openIds.includes(faq.id)
                const buttonId = `faq-trigger-${faq.id}`
                const panelId = `faq-panel-${faq.id}`

                return (
                  <article key={faq.id} className="rounded-lg bg-surface p-5">
                    <button
                      type="button"
                      id={buttonId}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => toggleFaq(faq.id)}
                      className="flex w-full flex-col gap-2 rounded-sm text-start focus-visible:outline-3 focus-visible:outline-focus focus-visible:outline-offset-2"
                    >
                      <span className="text-body-md text-text-secondary">{faq.category}</span>
                      <span className="flex w-full items-center justify-between gap-3">
                        <span className="flex-1 text-body-lg text-text-primary">
                          {faq.question}
                        </span>
                        <ChevronDown
                          className={`size-6 shrink-0 text-text-primary transition-transform duration-200 ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                          strokeWidth={1.75}
                          aria-hidden="true"
                        />
                      </span>
                    </button>

                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={buttonId}
                      aria-hidden={!isOpen}
                      className={`grid transition-[grid-template-rows,margin-top,opacity] duration-200 ease-out ${
                        isOpen
                          ? 'visible mt-2 grid-rows-[1fr] opacity-100'
                          : 'invisible mt-0 grid-rows-[0fr] opacity-0'
                      }`}
                    >
                      <div className="min-h-0 overflow-hidden">
                        <p className="text-body-md text-text-primary">{faq.answer}</p>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>

          <aside aria-labelledby="support-form-heading" className="w-full shrink-0 lg:w-[360px]">
            <form
              onSubmit={handleSubmit}
              noValidate
              className="flex flex-col gap-5 rounded-lg bg-surface-sage p-6"
            >
              <h2 id="support-form-heading" className="text-title-md text-text-primary">
                پیام به پشتیبانی
              </h2>

              <TextArea
                label="پیام شما"
                name="supportMessage"
                placeholder="سؤالتان را بنویسید"
                rows={3}
                value={message}
                error={error}
                onChange={(event) => {
                  setMessage(event.target.value)
                  if (error) setError(undefined)
                  if (submitted) setSubmitted(false)
                }}
              />

              {submitted && (
                <InlineAlert tone="success" className="border border-success/25 bg-surface!">
                  پیام شما ثبت شد. تیم پشتیبانی پس از بررسی پاسخ را برای شما ارسال می‌کند.
                </InlineAlert>
              )}

              <Button type="submit" variant="primary" size="lg" fullWidth>
                ارسال پیام
              </Button>
            </form>
          </aside>
        </div>
      </main>
    </>
  )
}
