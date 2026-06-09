/**
 * Servicio de plantillas de correo para Industria Gráfica Damian.
 * Cumple con el principio de Responsabilidad Única (SRP) al separar la generación de HTML de la lógica de negocio.
 */
export const EmailTemplates = {
  /**
   * Genera el HTML para el correo de restablecimiento de contraseña.
   */
  getForgotPasswordTemplate(code: string): string {
    const currentYear = new Date().getFullYear();
    return `
      <div style="background-color: #f8fafc; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; min-height: 100%;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          <!-- CMYK/Print Shop Accent Top Bar -->
          <div style="height: 6px; font-size: 0; line-height: 0; display: table; width: 100%;">
            <div style="display: table-cell; width: 25%; background-color: #00aeef; height: 6px;"></div>
            <div style="display: table-cell; width: 25%; background-color: #ec008c; height: 6px;"></div>
            <div style="display: table-cell; width: 25%; background-color: #fff200; height: 6px;"></div>
            <div style="display: table-cell; width: 25%; background-color: #231f20; height: 6px;"></div>
          </div>
          
          <!-- Header -->
          <div style="padding: 32px 40px 24px 40px; text-align: center; background-color: #0f172a;">
            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">
              <span style="color: #00aeef;">I</span>NDUSTRIA <span style="color: #ec008c;">G</span>RÁFICA <span style="color: #fff200;">D</span>AMIAN
            </h1>
            <p style="margin: 6px 0 0 0; color: #94a3b8; font-size: 12px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase;">
              Sistema de Gestión Operativa
            </p>
          </div>

          <!-- Body -->
          <div style="padding: 40px 40px 32px 40px;">
            <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 20px; font-weight: 700; text-align: center;">
              Restablecer tu contraseña
            </h2>
            <p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; line-height: 1.6; text-align: center;">
              Has solicitado recuperar el acceso a tu cuenta en Industria Gráfica Damian. Utiliza el siguiente código de verificación de un solo uso para continuar con el proceso:
            </p>

            <!-- OTP Container -->
            <div style="text-align: center; margin: 32px 0; padding: 24px; background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); border-radius: 12px; border: 1px dashed #cbd5e1;">
              <div style="font-size: 11px; text-transform: uppercase; color: #64748b; letter-spacing: 1.5px; font-weight: 700; margin-bottom: 8px;">
                Código de Verificación
              </div>
              <div style="font-size: 38px; font-weight: 800; letter-spacing: 6px; color: #0f172a; font-family: monospace;">
                ${code}
              </div>
              <div style="font-size: 12px; color: #64748b; margin-top: 10px; font-weight: 600;">
                ⏳ Válido únicamente por 10 minutos
              </div>
            </div>

            <p style="margin: 0 0 32px 0; color: #475569; font-size: 14px; line-height: 1.5; text-align: center;">
              Introduce este código en la pantalla de recuperación del sistema para establecer una nueva clave.
            </p>

            <!-- Security Notice -->
            <div style="padding: 16px 20px; background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 4px;">
              <h4 style="margin: 0 0 4px 0; color: #b45309; font-size: 13px; font-weight: 700;">
                ⚠️ Advertencia de Seguridad
              </h4>
              <p style="margin: 0; color: #78350f; font-size: 12px; line-height: 1.5;">
                Si tú no has solicitado este cambio, puedes ignorar este correo con total tranquilidad. Tu contraseña actual no será modificada a menos que utilices el código.
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="padding: 24px 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
            <p style="margin: 0 0 8px 0; color: #94a3b8; font-size: 12px;">
              Este es un correo automático, por favor no respondas a este mensaje.
            </p>
            <p style="margin: 0; color: #64748b; font-size: 12px; font-weight: 600;">
              © ${currentYear} Industria Gráfica Damian. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Genera el HTML para el envío de cotización.
   */
  getQuotationTemplate(quotation: any): string {
    const currentYear = new Date().getFullYear();
    const fmt = (n: number) => `S/ ${n.toFixed(2)}`;
    const itemsHtml = (quotation.items || []).map((i: any) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px; font-size: 14px; color: #334155;">${i.description}</td>
        <td style="padding: 12px; font-size: 14px; color: #334155; text-align: right;">${i.quantity}</td>
        <td style="padding: 12px; font-size: 14px; color: #334155; text-align: right;">${fmt(i.unitPrice)}</td>
        <td style="padding: 12px; font-size: 14px; color: #0f172a; font-weight: bold; text-align: right;">${fmt(i.totalPrice)}</td>
      </tr>
    `).join("");

    return `
      <div style="background-color: #f8fafc; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          <div style="height: 6px; font-size: 0; line-height: 0; display: table; width: 100%;">
            <div style="display: table-cell; width: 25%; background-color: #00aeef; height: 6px;"></div>
            <div style="display: table-cell; width: 25%; background-color: #ec008c; height: 6px;"></div>
            <div style="display: table-cell; width: 25%; background-color: #fff200; height: 6px;"></div>
            <div style="display: table-cell; width: 25%; background-color: #231f20; height: 6px;"></div>
          </div>
          
          <div style="padding: 32px 40px 24px 40px; background-color: #0f172a; text-align: center;">
            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; text-transform: uppercase;">
              <span style="color: #00aeef;">I</span>NDUSTRIA <span style="color: #ec008c;">G</span>RÁFICA <span style="color: #fff200;">D</span>AMIAN
            </h1>
            <p style="margin: 6px 0 0 0; color: #94a3b8; font-size: 12px; letter-spacing: 1px;">COTIZACIÓN DE SERVICIOS GRÁFICOS</p>
          </div>

          <div style="padding: 30px 40px;">
            <h2 style="color: #0f172a; font-size: 18px; font-weight: bold; margin-bottom: 20px; text-align: center;">
              Documento: ${quotation.quotationNumber}
            </h2>
            
            <div style="background-color: #f1f5f9; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
              <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #475569; text-transform: uppercase;">Datos del Cliente</h3>
              <p style="margin: 4px 0; font-size: 14px; color: #0f172a;"><strong>Nombre / R.S:</strong> ${quotation.clientName}</p>
              <p style="margin: 4px 0; font-size: 14px; color: #0f172a;"><strong>DNI / RUC:</strong> ${quotation.clientDocument}</p>
              ${quotation.clientAddress ? `<p style="margin: 4px 0; font-size: 14px; color: #0f172a;"><strong>Dirección:</strong> ${quotation.clientAddress}</p>` : ""}
              <p style="margin: 4px 0; font-size: 12px; color: #64748b; margin-top: 10px;">
                ⏳ Validez: hasta el ${new Date(quotation.validUntil).toLocaleDateString("es-PE")}
              </p>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <thead>
                <tr style="background-color: #f8fafc; border-bottom: 2px solid #cbd5e1;">
                  <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: bold; color: #64748b;">Descripción</th>
                  <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: bold; color: #64748b; width: 60px;">Cant.</th>
                  <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: bold; color: #64748b; width: 90px;">P. Unit</th>
                  <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: bold; color: #64748b; width: 100px;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div style="width: 250px; margin-left: auto; border-top: 2px solid #cbd5e1; padding-top: 12px; margin-bottom: 20px;">
              <div style="display: flex; justify-content: space-between; font-size: 13px; color: #475569; margin-bottom: 4px;">
                <span>Subtotal:</span>
                <strong>${fmt(quotation.subtotal)}</strong>
              </div>
              ${quotation.discount > 0 ? `
              <div style="display: flex; justify-content: space-between; font-size: 13px; color: #ef4444; margin-bottom: 4px;">
                <span>Descuento:</span>
                <strong>-${fmt(quotation.discount)}</strong>
              </div>` : ""}
              <div style="display: flex; justify-content: space-between; font-size: 13px; color: #475569; margin-bottom: 4px;">
                <span>IGV (${quotation.tax}%):</span>
                <strong>${fmt((quotation.subtotal - quotation.discount) * (quotation.tax / 100))}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 16px; color: #0f172a; font-weight: bold; border-top: 1px solid #e2e8f0; padding-top: 6px; margin-top: 6px;">
                <span>Total:</span>
                <span style="color: #2563eb;">${fmt(quotation.total)}</span>
              </div>
            </div>

            ${quotation.notes ? `
            <div style="margin-top: 24px; padding: 12px; border-left: 4px solid #cbd5e1; background-color: #f8fafc; font-size: 13px; color: #475569;">
              <strong>Notas:</strong><br/>
              ${quotation.notes.replace(/\n/g, "<br/>")}
            </div>` : ""}
          </div>

          <div style="padding: 24px 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
            <p style="margin: 0; color: #64748b; font-size: 12px; font-weight: bold;">
              © ${currentYear} Industria Gráfica Damian. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Genera el HTML para el envío de nota de venta / boleta / factura.
   */
  getSaleTemplate(sale: any): string {
    const currentYear = new Date().getFullYear();
    const fmt = (n: number) => `S/ ${n.toFixed(2)}`;
    const itemsHtml = (sale.items || []).map((i: any) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px; font-size: 14px; color: #334155;">${i.description}</td>
        <td style="padding: 12px; font-size: 14px; color: #334155; text-align: right;">${i.quantity}</td>
        <td style="padding: 12px; font-size: 14px; color: #334155; text-align: right;">${fmt(i.unitPrice)}</td>
        <td style="padding: 12px; font-size: 14px; color: #0f172a; font-weight: bold; text-align: right;">${fmt(i.totalPrice)}</td>
      </tr>
    `).join("");

    const documentName = sale.billingType === "BOLETA" ? "BOLETA DE VENTA" : sale.billingType === "FACTURA" ? "FACTURA" : "NOTA DE VENTA";
    const documentCode = sale.billingNumber || sale.saleNumber;

    return `
      <div style="background-color: #f8fafc; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          <div style="height: 6px; font-size: 0; line-height: 0; display: table; width: 100%;">
            <div style="display: table-cell; width: 25%; background-color: #00aeef; height: 6px;"></div>
            <div style="display: table-cell; width: 25%; background-color: #ec008c; height: 6px;"></div>
            <div style="display: table-cell; width: 25%; background-color: #fff200; height: 6px;"></div>
            <div style="display: table-cell; width: 25%; background-color: #231f20; height: 6px;"></div>
          </div>
          
          <div style="padding: 32px 40px 24px 40px; background-color: #0f172a; text-align: center;">
            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; text-transform: uppercase;">
              <span style="color: #00aeef;">I</span>NDUSTRIA <span style="color: #ec008c;">G</span>RÁFICA <span style="color: #fff200;">D</span>AMIAN
            </h1>
            <p style="margin: 6px 0 0 0; color: #94a3b8; font-size: 12px; letter-spacing: 1px;">COMPROBANTE DE COMPRA</p>
          </div>

          <div style="padding: 30px 40px;">
            <h2 style="color: #0f172a; font-size: 18px; font-weight: bold; margin-bottom: 20px; text-align: center; text-transform: uppercase;">
              ${documentName}: ${documentCode}
            </h2>
            
            <div style="background-color: #f1f5f9; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
              <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #475569; text-transform: uppercase;">Datos del Cliente</h3>
              <p style="margin: 4px 0; font-size: 14px; color: #0f172a;"><strong>Nombre / R.S:</strong> ${sale.clientName}</p>
              <p style="margin: 4px 0; font-size: 14px; color: #0f172a;"><strong>DNI / RUC:</strong> ${sale.clientDocument}</p>
              ${sale.clientAddress ? `<p style="margin: 4px 0; font-size: 14px; color: #0f172a;"><strong>Dirección:</strong> ${sale.clientAddress}</p>` : ""}
              <p style="margin: 4px 0; font-size: 12px; color: #64748b; margin-top: 10px;">
                📅 Emitido: ${new Date(sale.createdAt).toLocaleDateString("es-PE")} | <strong>Estado: ${sale.status}</strong>
              </p>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <thead>
                <tr style="background-color: #f8fafc; border-bottom: 2px solid #cbd5e1;">
                  <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: bold; color: #64748b;">Descripción</th>
                  <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: bold; color: #64748b; width: 60px;">Cant.</th>
                  <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: bold; color: #64748b; width: 90px;">P. Unit</th>
                  <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: bold; color: #64748b; width: 100px;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div style="width: 250px; margin-left: auto; border-top: 2px solid #cbd5e1; padding-top: 12px; margin-bottom: 20px;">
              <div style="display: flex; justify-content: space-between; font-size: 13px; color: #475569; margin-bottom: 4px;">
                <span>Subtotal:</span>
                <strong>${fmt(sale.subtotal)}</strong>
              </div>
              ${sale.discount > 0 ? `
              <div style="display: flex; justify-content: space-between; font-size: 13px; color: #ef4444; margin-bottom: 4px;">
                <span>Descuento:</span>
                <strong>-${fmt(sale.discount)}</strong>
              </div>` : ""}
              <div style="display: flex; justify-content: space-between; font-size: 13px; color: #475569; margin-bottom: 4px;">
                <span>IGV (${sale.tax}%):</span>
                <strong>${fmt((sale.subtotal - sale.discount) * (sale.tax / 100))}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 16px; color: #0f172a; font-weight: bold; border-top: 1px solid #e2e8f0; padding-top: 6px; margin-top: 6px;">
                <span>Total:</span>
                <span style="color: #16a34a;">${fmt(sale.total)}</span>
              </div>
            </div>

            <div style="margin-top: 24px; padding: 12px; border-left: 4px solid #16a34a; background-color: #f0fdf4; font-size: 13px; color: #15803d; border-radius: 4px;">
              <strong>Método de Pago:</strong> ${sale.paymentMethod}<br/>
              ¡Gracias por su preferencia!
            </div>
          </div>

          <div style="padding: 24px 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
            <p style="margin: 0; color: #64748b; font-size: 12px; font-weight: bold;">
              © ${currentYear} Industria Gráfica Damian. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    `;
  }
};
