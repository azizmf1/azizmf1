import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Button } from "@/components/hms/Button";
import { Card, CardHeader, CardBody } from "@/components/hms/Card";
import { Field, TextInput, Select, TextArea } from "@/components/hms/Field";
import { StatusBadge, ResultBadge } from "@/components/hms/Badges";
import { BloodChips } from "@/components/hms/BloodChips";
import { PassFailToggle } from "@/components/hms/PassFail";
import { ReportSection } from "@/components/hms/ReportSection";
import { Modal } from "@/components/hms/Modal";
import { Toaster, toast } from "@/components/hms/Toast";
import { ApplicantVerification } from "@/components/hms/ApplicantVerification";
import type { ReportStatus } from "@/data/lookups";

describe("Button", () => {
  it("renders every variant and state", () => {
    for (const v of ["primary", "secondary", "ghost", "danger", "success"] as const) {
      const { container } = render(<Button variant={v}>حفظ</Button>);
      expect(container.textContent).toContain("حفظ");
    }
    for (const s of ["sm", "md", "lg"] as const) {
      render(<Button size={s}>x</Button>);
    }
    const { container } = render(
      <Button loading block icon={<span />} iconEnd={<span />} disabled>
        إرسال
      </Button>,
    );
    expect(container.querySelector("button")).toBeTruthy();
  });
});

describe("Card", () => {
  it("renders header and body", () => {
    const { container } = render(
      <Card className="x">
        <CardHeader title="عنوان" subtitle="وصف" icon={<span />} action={<span>a</span>} />
        <CardBody className="y">محتوى</CardBody>
      </Card>,
    );
    expect(container.textContent).toContain("عنوان");
    expect(container.textContent).toContain("محتوى");
  });
});

describe("Field and inputs", () => {
  it("renders field, text input, select, textarea", () => {
    const { container } = render(
      <div>
        <Field label="الاسم" required error="خطأ">
          <TextInput invalid ltr addonStart={<span>+</span>} />
        </Field>
        <Field label="جوال" hint="تلميح">
          <TextInput ltr />
        </Field>
        <Select
          options={[{ value: "a", label: "A" }]}
          placeholder="اختر"
          invalid
        />
        <TextArea invalid rows={2} />
      </div>,
    );
    expect(container.textContent).toContain("الاسم");
    expect(container.querySelector("select")).toBeTruthy();
    expect(container.querySelector("textarea")).toBeTruthy();
  });
});

describe("Badges", () => {
  it("renders all statuses and results", () => {
    const statuses: ReportStatus[] = [
      "draft",
      "pending_audit",
      "completed",
      "requires_modification",
      "expired",
    ];
    for (const s of statuses) {
      const { container } = render(<StatusBadge status={s} />);
      expect(container.textContent).toBeTruthy();
    }
    render(<ResultBadge result="fit" size="lg" />);
    render(<ResultBadge result="unfit" size="sm" />);
    const { container } = render(<ResultBadge result={null} />);
    expect(container.textContent).toContain("غير محدد");
  });
});

describe("BloodChips and PassFail", () => {
  it("renders", () => {
    const c1 = render(<BloodChips value="O+" onChange={() => {}} />).container;
    expect(c1.textContent).toContain("O+");
    const c2 = render(<PassFailToggle value="passed" onChange={() => {}} />).container;
    expect(c2.textContent).toContain("سليم");
    const c3 = render(
      <PassFailToggle
        value="failed"
        onChange={() => {}}
        disabled
        passedLabel="نعم"
        failedLabel="لا"
      />,
    ).container;
    expect(c3.textContent).toContain("لا");
  });
});

describe("ReportSection, Modal, Toast", () => {
  it("renders section", () => {
    const { container } = render(
      <ReportSection title="القسم" subtitle="س" icon={<span />}>
        محتوى
      </ReportSection>,
    );
    expect(container.textContent).toContain("القسم");
  });

  it("renders modal tones and closed state", () => {
    for (const t of ["default", "warn", "danger", "success"] as const) {
      const { container } = render(
        <Modal
          open
          onClose={() => {}}
          title="عنوان"
          description="وصف"
          tone={t}
          size="lg"
          footer={<span>f</span>}
        >
          محتوى
        </Modal>,
      );
      expect(container.textContent).toContain("عنوان");
    }
    const { container } = render(
      <Modal open={false} onClose={() => {}} title="مخفي" />,
    );
    expect(container.textContent).toBe("");
  });

  it("renders toaster and pushes toasts", () => {
    const { container } = render(<Toaster />);
    toast.success("تم", "وصف");
    toast.error("خطأ");
    toast.warn("تنبيه");
    toast.info("معلومة");
    expect(container).toBeTruthy();
  });

  it("renders the applicant verification step", () => {
    const { container } = render(<ApplicantVerification onVerified={() => {}} />);
    expect(container.textContent).toContain("التحقق");
  });
});
