const fs = require("fs");
let content = fs.readFileSync("pathora/frontend/src/features/bookings/components/CustomerAddParticipants.tsx", "utf-8");

// Remove disabled={!p.isNew} from input fields (but maybe keep for ParticipantType since changing type might mess up pricing or limits? Wait, the user said they want to edit their info. Full Name, DOB, Gender, Nationality). Let's remove disabled for all except participantType to be safe, or just all.
content = content.replace(/disabled=\{\!p\.isNew\}/g, "");
content = content.replace(/disabled:opacity-60/g, "");

// Update handleSave to also process existing participants whose info was edited.
// How do we know if it was edited? If we don't track dirty state, we can just send updateParticipant for all existing rows, or all rowsToProcess. Let's just process all participants.
// Or we can check if they have changed. Wait, since it's a bulk save, we can just call updateParticipant for all !isNew participants.

content = content.replace(
  /const rowsToProcess = participants\.filter\(p => p\.isNew \|\| isVisaActionable\(p\)\);/,
  `const rowsToProcess = participants;`
);

content = content.replace(
  /let participantId: string \| undefined = p\.isNew \? undefined : p\.id;\n\n\s+if \(p\.isNew\) \{\n\s+participantId = await bookingService\.createParticipant\(bookingId, \{\n\s+participantType: p\.participantType \|\| "Adult",\n\s+fullName: p\.fullName,\n\s+dateOfBirth: p\.dob \? new Date\(p\.dob\)\.toISOString\(\) : null,\n\s+gender: p\.gender,\n\s+nationality: p\.nationality \|\| "VN",\n\s+\}\);\n\s+\}/,
  `let participantId: string | undefined = p.isNew ? undefined : p.id;

        if (p.isNew) {
          participantId = await bookingService.createParticipant(bookingId, {
            participantType: p.participantType || "Adult",
            fullName: p.fullName,
            dateOfBirth: p.dob ? new Date(p.dob).toISOString() : null,
            gender: p.gender,
            nationality: p.nationality || "VN",
          });
        } else {
          // Extract real UUID, removing "existing-123-0" fallback prefix if any. 
          // p.id might be a pure UUID if it came from DB, or something else. The DB returns pure UUIDs.
          const realId = p.id;
          await bookingService.updateParticipant(bookingId, realId, {
            participantId: realId,
            participantType: p.participantType || "Adult",
            fullName: p.fullName,
            dateOfBirth: p.dob ? new Date(p.dob).toISOString() : null,
            gender: p.gender,
            nationality: p.nationality || "VN",
          });
        }`
);

// We need to modify isVisaActionable slightly if we changed rowsToProcess.
// Previously validateRow checked: if (p.isNew && !p.fullName) return err.
// Now validateRow should check fullName for ALL rows.
content = content.replace(
  /if \(p\.isNew && !p\.fullName\.trim\(\)\) return `Hành khách thiếu họ tên\.`;/,
  `if (!p.fullName.trim()) return \`Hành khách thiếu họ tên.\`;`
);

fs.writeFileSync("pathora/frontend/src/features/bookings/components/CustomerAddParticipants.tsx", content, "utf-8");
