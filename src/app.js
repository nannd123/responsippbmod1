import "dotenv/config";
import express from "express";
import cors from "cors";
import { supabase } from "./supabase.js";

const app = express();

app.disable("x-powered-by");
app.use(cors());
app.use(express.json());

const VALID_STATUSES = ["Dipinjam", "Dikembalikan", "Terlambat"];

function isValidDateString(value) {
  if (typeof value !== "string") return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime());
}

function validateStatus(status) {
  return VALID_STATUSES.includes(status);
}

function validateLoanDates(loanDate, dueDate) {
  if (!isValidDateString(loanDate) || !isValidDateString(dueDate)) {
    return "loan_date dan due_date harus berupa tanggal valid dengan format YYYY-MM-DD.";
  }

  if (new Date(`${dueDate}T00:00:00Z`) < new Date(`${loanDate}T00:00:00Z`)) {
    return "due_date tidak boleh lebih awal dari loan_date.";
  }

  return null;
}

function sendDatabaseError(res, error) {
  console.error(error);
  return res.status(500).json({
    success: false,
    message: "Terjadi kesalahan saat mengakses database.",
  });
}


// Health / root endpoint

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Library Loan REST API aktif.",
    endpoints: {
      list: "GET /loans",
      detail: "GET /loans/:id",
      create: "POST /loans",
      update: "PUT /loans/:id",
      delete: "DELETE /loans/:id",
      filter: "GET /loans?status=Terlambat",
    },
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "ok",
  });
});


// READ ALL + FILTER

app.get("/loans", async (req, res) => {
  const { status, member_name, book_title } = req.query;

  if (status && !validateStatus(status)) {
    return res.status(400).json({
      success: false,
      message: `Status harus salah satu dari: ${VALID_STATUSES.join(", ")}.`,
    });
  }

  let query = supabase
    .from("loans")
    .select("*")
    .order("id", { ascending: true });

  if (status) {
    query = query.eq("status", status);
  }

  if (member_name) {
    query = query.ilike("member_name", `%${member_name}%`);
  }

  if (book_title) {
    query = query.ilike("book_title", `%${book_title}%`);
  }

  const { data, error } = await query;

  if (error) {
    return sendDatabaseError(res, error);
  }

  return res.status(200).json({
    success: true,
    count: data.length,
    data,
  });
});

// READ BY ID

app.get("/loans/:id", async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("loans")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return sendDatabaseError(res, error);
  }

  if (!data) {
    return res.status(404).json({
      success: false,
      message: "Data peminjaman tidak ditemukan.",
    });
  }

  return res.status(200).json({
    success: true,
    data,
  });
});

// CREATE

app.post("/loans", async (req, res) => {
  const {
    member_name,
    book_title,
    loan_date,
    due_date,
    return_date = null,
    status = "Dipinjam",
  } = req.body;

  if (!member_name || !book_title || !loan_date || !due_date) {
    return res.status(400).json({
      success: false,
      message:
        "member_name, book_title, loan_date, dan due_date wajib diisi.",
    });
  }

  if (!validateStatus(status)) {
    return res.status(400).json({
      success: false,
      message: `Status harus salah satu dari: ${VALID_STATUSES.join(", ")}.`,
    });
  }

  const dateError = validateLoanDates(loan_date, due_date);
  if (dateError) {
    return res.status(400).json({
      success: false,
      message: dateError,
    });
  }

  if (return_date && !isValidDateString(return_date)) {
    return res.status(400).json({
      success: false,
      message: "return_date harus berupa tanggal valid dengan format YYYY-MM-DD.",
    });
  }

  const { data, error } = await supabase
    .from("loans")
    .insert({
      member_name: String(member_name).trim(),
      book_title: String(book_title).trim(),
      loan_date,
      due_date,
      return_date,
      status,
    })
    .select()
    .single();

  if (error) {
    return sendDatabaseError(res, error);
  }

  return res.status(201).json({
    success: true,
    message: "Data peminjaman berhasil ditambahkan.",
    data,
  });
});

// UPDATE

async function updateLoan(req, res) {
  const { id } = req.params;

  const allowedFields = [
    "member_name",
    "book_title",
    "loan_date",
    "due_date",
    "return_date",
    "status",
  ];

  const updateData = {};

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  }

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({
      success: false,
      message: "Tidak ada field yang dapat diperbarui.",
    });
  }

  if (updateData.status && !validateStatus(updateData.status)) {
    return res.status(400).json({
      success: false,
      message: `Status harus salah satu dari: ${VALID_STATUSES.join(", ")}.`,
    });
  }

  if (
    updateData.return_date !== undefined &&
    updateData.return_date !== null &&
    !isValidDateString(updateData.return_date)
  ) {
    return res.status(400).json({
      success: false,
      message: "return_date harus berupa tanggal valid dengan format YYYY-MM-DD.",
    });
  }

  const { data: existingLoan, error: existingError } = await supabase
    .from("loans")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (existingError) {
    return sendDatabaseError(res, existingError);
  }

  if (!existingLoan) {
    return res.status(404).json({
      success: false,
      message: "Data peminjaman tidak ditemukan.",
    });
  }

  const finalLoanDate = updateData.loan_date ?? existingLoan.loan_date;
  const finalDueDate = updateData.due_date ?? existingLoan.due_date;

  const dateError = validateLoanDates(finalLoanDate, finalDueDate);
  if (dateError) {
    return res.status(400).json({
      success: false,
      message: dateError,
    });
  }

  if (updateData.member_name !== undefined) {
    updateData.member_name = String(updateData.member_name).trim();
  }

  if (updateData.book_title !== undefined) {
    updateData.book_title = String(updateData.book_title).trim();
  }

  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("loans")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return sendDatabaseError(res, error);
  }

  return res.status(200).json({
    success: true,
    message: "Data peminjaman berhasil diperbarui.",
    data,
  });
}

app.put("/loans/:id", updateLoan);
app.patch("/loans/:id", updateLoan);

// DELETE

app.delete("/loans/:id", async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("loans")
    .delete()
    .eq("id", id)
    .select();

  if (error) {
    return sendDatabaseError(res, error);
  }

  if (!data || data.length === 0) {
    return res.status(404).json({
      success: false,
      message: "Data peminjaman tidak ditemukan.",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Data peminjaman berhasil dihapus.",
    data: data[0],
  });
});

// 404

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint tidak ditemukan.",
  });
});

export default app;
