import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { entrySchema } from '@/schemas/vehicleEntry.js';
import { settingsService } from '@/services/settingsService.js';
import { sessionService } from '@/services/sessionService.js';
import { useGuardedMutation } from '@/hooks/useGuardedMutation.js';
import { useLot } from '@/context/LotContext.jsx';
import { useNetwork } from '@/app/providers/NetworkProvider.jsx';
import { slotFits, vehicleTypeLabel } from '@/constants/vehicleTypes.js';
import { MSG } from '@/constants/messages.js';
import { uuid } from '@/utils/ids.js';
import { loadDraft, saveDraft, clearDrafts } from '@/utils/drafts.js';
import { cleanPlateInput, maskPhone } from '@/utils/format.js';
import PageHeader from '@/components/common/PageHeader.jsx';
import Button from '@/components/ui/Button.jsx';
import Card from '@/components/ui/Card.jsx';
import Stepper from '@/components/ui/Stepper.jsx';
import Alert from '@/components/feedback/Alert.jsx';
import { Field, Input } from '@/components/forms/Field.jsx';
import PlateInput from '@/components/forms/PlateInput.jsx';
import VehicleTypePicker from '@/components/forms/VehicleTypePicker.jsx';
import CameraCapture from '@/components/common/CameraCapture.jsx';
import { useSlots } from '@/features/parking-slots/hooks/useSlots.js';
import SlotPicker from '../components/SlotPicker.jsx';
import TicketSuccess from '../components/TicketSuccess.jsx';

const STEPS = ['Vehicle', 'Space', 'Photo', 'Review'];

export default function VehicleEntryPage() {
  const { lotId, lot } = useLot();
  const qc = useQueryClient();
  const { online } = useNetwork();
  const policy = useQuery({ queryKey: ['settings', 'policy'], queryFn: settingsService.policy, staleTime: 5 * 60_000 });
  const requirePhone = policy.data?.requireCustomerPhone ?? true;
  const requirePhoto = policy.data?.requirePhotos ?? true;

  const [step, setStep] = useState(0);
  const [slotId, setSlotId] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [created, setCreated] = useState(null);
  const [banner, setBanner] = useState(null); // {tone,title,body,link}
  const [draft, setDraft] = useState(() => loadDraft());
  const idemKey = useRef(uuid());

  const form = useForm({ resolver: zodResolver(entrySchema({ requirePhone })), defaultValues: { plateNumber: '', vehicleType: 'CAR', customerPhone: '', ownerName: '' }, mode: 'onTouched' });
  const { register, watch, trigger, getValues, setValue, setError, reset, formState: { errors } } = form;
  const values = watch();
  useEffect(() => { if (values.plateNumber || values.customerPhone) saveDraft({ plateNumber: values.plateNumber, vehicleType: values.vehicleType, customerPhone: values.customerPhone, ownerName: values.ownerName }); }, [values.plateNumber, values.vehicleType, values.customerPhone, values.ownerName]);

  // Keep chosen slot compatible if the vehicle type changes after choosing.
  const slots = useSlots(lotId, { status: 'AVAILABLE' }, { refetchInterval: false });
  const chosenSlot = slots.data?.find((s) => s.id === slotId);
  useEffect(() => { if (slotId && slots.data && chosenSlot && !slotFits(chosenSlot.vehicleType, values.vehicleType)) setSlotId(null); }, [values.vehicleType, chosenSlot, slotId, slots.data]);

  const submit = useGuardedMutation(() => sessionService.create({
    lotId, slotId, plateNumber: getValues('plateNumber').trim(), vehicleType: getValues('vehicleType'),
    customerPhone: getValues('customerPhone')?.replace(/[\s-]/g, '') || undefined, ownerName: getValues('ownerName') || undefined, entryPhotoUrl: photo?.ref?.url,
  }, idemKey.current), {
    onSuccess: (s) => { clearDrafts(); setCreated(s); setBanner(null); qc.invalidateQueries({ queryKey: ['slots'] }); qc.invalidateQueries({ queryKey: ['sessions'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); },
    onError: (e) => {
      if (e.code === 'SLOT_CONFLICT') { idemKey.current = uuid(); setSlotId(null); setStep(1); qc.invalidateQueries({ queryKey: ['slots'] }); setBanner({ tone: 'warning', title: 'Space no longer available', body: MSG.slotTaken }); }
      else if (e.code === 'DUPLICATE_ACTIVE_SESSION') setBanner({ tone: 'warning', title: 'Already parked', body: e.message, link: e.details?.sessionId && `/sessions/${e.details.sessionId}` });
      else if (e.kind === 'validation') { Object.entries(e.fieldErrors).forEach(([k, msg]) => { if (k in getValues()) setError(k, { message: msg }); }); setStep(Object.keys(e.fieldErrors).some((k) => k === 'plateNumber' || k === 'vehicleType' || k === 'customerPhone') ? 0 : 2); setBanner({ tone: 'danger', title: 'Check the details', body: e.message }); }
      else if (e.kind === 'network') setBanner({ tone: 'warning', title: 'Not confirmed', body: MSG.networkLost, checkActive: true });
      else setBanner({ tone: 'danger', title: 'Entry not recorded', body: e.message });
    },
  });

  const restart = () => { if (photo?.previewUrl) URL.revokeObjectURL(photo.previewUrl); clearDrafts(); reset({ plateNumber: '', vehicleType: 'CAR', customerPhone: '', ownerName: '' }); setSlotId(null); setPhoto(null); setCreated(null); setBanner(null); setStep(0); idemKey.current = uuid(); };
  const restoreDraft = () => { Object.entries(draft).forEach(([k, v]) => setValue(k, v, { shouldValidate: false })); setDraft(null); };

  if (created) return <div className="mx-auto max-w-lg"><TicketSuccess session={created} onNew={restart} /></div>;

  const next = async () => {
    if (step === 0 && !(await trigger())) return;
    if (step === 1 && !slotId) return;
    if (step === 2 && requirePhoto && !photo?.ref) return;
    setStep((s) => s + 1);
  };
  const canNext = step === 0 || (step === 1 && !!slotId) || (step === 2 && (!requirePhoto || !!photo?.ref));

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Vehicle entry" description={lot?.name} />
      <Stepper steps={STEPS} current={step} />
      {draft && step === 0 && !values.plateNumber && (
        <Alert tone="info" className="mb-4" action={<div className="flex gap-2"><Button size="sm" onClick={restoreDraft}>Restore draft</Button><Button size="sm" variant="ghost" onClick={() => { clearDrafts(); setDraft(null); }}>Discard</Button></div>}>An unfinished entry was saved on this device. It is not recorded until you confirm.</Alert>
      )}
      {banner && (
        <Alert tone={banner.tone} live title={banner.title} className="mb-4" action={<div className="flex flex-wrap gap-2">{banner.link && <Button as={Link} to={banner.link} size="sm" variant="secondary">Open session</Button>}{banner.checkActive && <Button as={Link} to="/sessions" size="sm" variant="secondary">Check active sessions</Button>}</div>}>{banner.body}</Alert>
      )}

      <Card className="space-y-5">
        {step === 0 && (
          <div className="space-y-5">
            <Field label="Plate number" error={errors.plateNumber?.message} required>{(p) => <PlateInput {...p} {...register('plateNumber', { onChange: (e) => setValue('plateNumber', cleanPlateInput(e.target.value)) })} />}</Field>
            <Field label="Vehicle type" error={errors.vehicleType?.message} required>{() => <VehicleTypePicker value={values.vehicleType} onChange={(v) => setValue('vehicleType', v, { shouldValidate: true })} invalid={!!errors.vehicleType} />}</Field>
            <Field label="Customer phone" required={requirePhone} hint="Rwanda format, e.g. 078 123 4567. Used for the ticket and payment." error={errors.customerPhone?.message}>{(p) => <Input {...p} {...register('customerPhone')} type="tel" inputMode="tel" autoComplete="off" placeholder="078 123 4567" />}</Field>
            <Field label="Owner name (optional)" error={errors.ownerName?.message}>{(p) => <Input {...p} {...register('ownerName')} autoComplete="off" />}</Field>
          </div>
        )}
        {step === 1 && <SlotPicker lotId={lotId} vehicleType={values.vehicleType} value={slotId} onChange={setSlotId} />}
        {step === 2 && <CameraCapture captureType="ENTRY" lotId={lotId} value={photo} onChange={setPhoto} instruction="Capture the vehicle and plate clearly." />}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg">Review and confirm</h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div><dt className="text-muted">Plate</dt><dd className="plate text-lg">{values.plateNumber}</dd></div>
              <div><dt className="text-muted">Vehicle type</dt><dd>{vehicleTypeLabel(values.vehicleType)}</dd></div>
              <div><dt className="text-muted">Space</dt><dd className="text-lg font-semibold">{chosenSlot?.slotNumber ?? '-'}</dd></div>
              <div><dt className="text-muted">Customer phone</dt><dd>{values.customerPhone ? maskPhone(values.customerPhone) : 'Not provided'}</dd></div>
            </dl>
            {photo?.previewUrl && <img src={photo.previewUrl} alt="Entry photo thumbnail" className="aspect-[4/3] w-full max-w-xs rounded-md border border-line object-cover" />}
            <p className="text-sm text-muted">{MSG.entryTimeNote}</p>
            {!online && <Alert tone="warning">{MSG.offline}</Alert>}
          </div>
        )}
      </Card>

      <div className="sticky bottom-24 z-10 mt-4 grid grid-cols-[auto_1fr] gap-2 md:static md:bottom-auto">
        <Button variant="secondary" size="lg" icon={ArrowLeft} onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || submit.isSubmitting} aria-label="Back" />
        {step < 3
          ? <Button size="lg" onClick={next} disabled={!canNext}>Continue<ArrowRight size={20} aria-hidden /></Button>
          : <Button size="lg" icon={Check} loading={submit.isSubmitting} disabled={!online || !slotId || (requirePhoto && !photo?.ref)} onClick={() => submit.mutate()}>Confirm vehicle entry</Button>}
      </div>
      {step === 1 && !slotId && <p className="mt-2 text-center text-sm text-muted">Choose a space to continue.</p>}
      {step === 2 && requirePhoto && !photo?.ref && <p className="mt-2 text-center text-sm text-muted">The photo must finish uploading before you can continue.</p>}
    </div>
  );
}
